import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { generateCertificatePdf } from "../certificate-pdf";
import { sendCertificationEmail } from "../email";
import { resolveLocale } from "../locale-resolver";
import { requireAuth, omitExamAnswers, examSubmitLimiter } from "./middleware";

export function registerLmsRoutes(app: Express) {
app.get("/api/courses", async (_req: Request, res: Response) => {
  try {
    const courseList = await storage.listActiveCourses();
    return res.json({ courses: courseList });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/courses/:slug", async (req: Request, res: Response) => {
  try {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const steps = await storage.getCourseSteps(course.id);
    return res.json({ course, steps: steps.map(s => ({ ...s, config: s.type === "exam" ? omitExamAnswers(s.config) : s.config })) });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/enrollments", requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollmentList = await storage.getEnrollmentsByUser(req.session.userId!);

    const enriched = await Promise.all(enrollmentList.map(async (enrollment) => {
      const course = await storage.getCourse(enrollment.courseId);
      const steps = await storage.getCourseSteps(enrollment.courseId);
      const progressRows = await storage.getStepProgress(enrollment.id);
      const completedStepIds = new Set(progressRows.filter(p => p.status === "completed").map(p => p.stepId));
      const completedSteps = steps.filter(s => completedStepIds.has(s.id)).length;
      const totalSteps = steps.length;
      const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      const remainingSteps = steps.filter(s => !completedStepIds.has(s.id));
      const estimatedMinutesRemaining = remainingSteps.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);

      let certificationId: number | null = null;
      if (enrollment.status === "completed") {
        const cert = await storage.getCertificationByEnrollment(enrollment.id);
        if (cert) certificationId = cert.id;
      }

      return {
        ...enrollment,
        certificationId,
        course: course ? {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          category: course.category,
          thumbnailUrl: course.thumbnailUrl,
        } : undefined,
        progress: {
          completedSteps,
          totalSteps,
          percentage,
          estimatedMinutesRemaining,
        },
      };
    }));

    return res.json({ enrollments: enriched });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/enrollments/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await storage.getEnrollment(parseInt(req.params.id));
    if (!enrollment || enrollment.userId !== req.session.userId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    return res.json({ enrollment });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/course-player/:enrollmentId/steps", requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await storage.getEnrollment(parseInt(req.params.enrollmentId));
    if (!enrollment || enrollment.userId !== req.session.userId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const steps = await storage.getCourseSteps(enrollment.courseId);
    const progress = await storage.getStepProgress(enrollment.id);
    const progressMap = new Map(progress.map(p => [p.stepId, p]));

    const stepsWithProgress = steps.map(step => ({
      ...step,
      config: step.type === "exam" ? omitExamAnswers(step.config) : step.config,
      progress: progressMap.get(step.id) || { status: "not_started" },
    }));

    return res.json({ steps: stepsWithProgress, enrollment });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/course-player/:enrollmentId/step/:stepId", requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await storage.getEnrollment(parseInt(req.params.enrollmentId));
    if (!enrollment || enrollment.userId !== req.session.userId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const steps = await storage.getCourseSteps(enrollment.courseId);
    const step = steps.find(s => s.id === parseInt(req.params.stepId));
    if (!step) return res.status(404).json({ error: "Step not found" });

    const stepIndex = steps.findIndex(s => s.id === step.id);
    if (stepIndex > 0) {
      const prevStep = steps[stepIndex - 1];
      const progress = await storage.getStepProgress(enrollment.id);
      const prevProgress = progress.find(p => p.stepId === prevStep.id);
      if (!prevProgress || prevProgress.status !== "completed") {
        return res.status(403).json({ error: "Complete the previous step first" });
      }
    }

    let questions: any[] = [];
    if (step.type === "exam" || step.type === "checkpoint") {
      questions = (await storage.getExamQuestions(step.id)).map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        order: q.order,
      }));
    }

    return res.json({ step: { ...step, config: (step.type === "exam" || step.type === "checkpoint") ? omitExamAnswers(step.config) : step.config }, questions });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/course-player/:enrollmentId/video-progress", requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await storage.getEnrollment(parseInt(req.params.enrollmentId));
    if (!enrollment || enrollment.userId !== req.session.userId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const { stepId, watchPercentage } = req.body;
    const steps = await storage.getCourseSteps(enrollment.courseId);
    const step = steps.find(s => s.id === stepId);
    if (!step || step.type !== "video") return res.status(400).json({ error: "Invalid video step" });

    const config = step.config as any;
    const minWatch = config?.min_watch_percentage || 80;
    const completed = watchPercentage >= minWatch;

    await storage.upsertStepProgress({
      enrollmentId: enrollment.id,
      stepId,
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? new Date() : undefined,
    });

    return res.json({ completed, watchPercentage });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/course-player/:enrollmentId/content-complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await storage.getEnrollment(parseInt(req.params.enrollmentId));
    if (!enrollment || enrollment.userId !== req.session.userId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const { stepId } = req.body;
    await storage.upsertStepProgress({
      enrollmentId: enrollment.id,
      stepId,
      status: "completed",
      completedAt: new Date(),
    });

    const allComplete = await storage.checkAllStepsCompleted(enrollment.id, enrollment.courseId);
    if (allComplete && enrollment.status !== "completed") {
      const hasPassedExam = await storage.hasPassedExamForCourse(enrollment.id, enrollment.courseId);
      if (hasPassedExam) {
        await storage.updateEnrollmentStatus(enrollment.id, "completed");

        const existingCert = await storage.getCertificationByEnrollment(enrollment.id);
        if (!existingCert) {
          const cert = await storage.issueCertification({
            enrollmentId: enrollment.id,
            userId: enrollment.userId!,
            courseId: enrollment.courseId,
            status: "issued",
            expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
          });

          try {
            await generateCertificatePdf(cert.id);
          } catch (pdfErr) {
            console.error("[Cert] PDF generation error:", pdfErr);
          }

          await storage.createAuditLog({
            actorUserId: enrollment.userId!,
            action: "certification_issued",
            entity: "certifications",
            entityId: String(cert.id),
            metadata: { courseId: enrollment.courseId, certificateNumber: cert.certificateNumber },
          });

          const certUser = await storage.getUser(enrollment.userId!);
          const certCourse = await storage.getCourse(enrollment.courseId);
          if (certUser && certCourse) {
            const certLocale = await resolveLocale({ userId: certUser.id, courseLanguage: certCourse.language });
            await sendCertificationEmail({
              to: certUser.email,
              userName: certUser.name,
              courseName: certCourse.title,
              certificateNumber: cert.certificateNumber,
              certificationId: cert.id,
              actorUserId: certUser.id,
              locale: certLocale,
            });
          }

          return res.json({ completed: true, allComplete: true, certification: cert });
        }
      }
    }

    return res.json({ completed: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/course-player/:enrollmentId/exam-submit", examSubmitLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const enrollment = await storage.getEnrollment(parseInt(req.params.enrollmentId));
    if (!enrollment || enrollment.userId !== req.session.userId) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const { stepId, answers } = req.body;
    const steps = await storage.getCourseSteps(enrollment.courseId);
    const step = steps.find(s => s.id === stepId);
    if (!step || (step.type !== "exam" && step.type !== "checkpoint")) return res.status(400).json({ error: "Invalid exam step" });

    const isCheckpoint = step.type === "checkpoint";
    const config = step.config as any;
    const maxAttempts = isCheckpoint ? 999 : (config?.max_attempts || 3);
    const passingScore = isCheckpoint ? 0 : (config?.passing_score || 70);

    const attemptCount = await storage.countExamAttempts(enrollment.id, stepId);
    if (attemptCount >= maxAttempts) {
      return res.status(400).json({ error: "Maximum attempts reached" });
    }

    const questions = await storage.getExamQuestions(stepId);
    let correct = 0;
    const graded: any[] = [];

    for (const q of questions) {
      const userAnswer = answers?.[q.id];
      const correctAnswer = q.correctAnswers as any;
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
      if (isCorrect) correct++;
      graded.push({
        questionId: q.id,
        userAnswer,
        correct: isCorrect,
        explanation: q.explanation,
      });
    }

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const passed = score >= passingScore;

    const attempt = await storage.createExamAttempt({
      enrollmentId: enrollment.id,
      stepId,
      attemptNumber: attemptCount + 1,
      score: String(score),
      passed,
      answers: graded,
      durationSeconds: req.body.durationSeconds,
    });

    if (passed) {
      await storage.upsertStepProgress({
        enrollmentId: enrollment.id,
        stepId,
        status: "completed",
        score: String(score),
        completedAt: new Date(),
      });

      const allComplete = await storage.checkAllStepsCompleted(enrollment.id, enrollment.courseId);
      if (allComplete) {
        await storage.updateEnrollmentStatus(enrollment.id, "completed");

        const course = await storage.getCourse(enrollment.courseId);
        const cert = await storage.issueCertification({
          enrollmentId: enrollment.id,
          userId: enrollment.userId!,
          courseId: enrollment.courseId,
          status: "issued",
          expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
        });

        try {
          await generateCertificatePdf(cert.id);
        } catch (pdfErr) {
          console.error("[Cert] PDF generation error:", pdfErr);
        }

        await storage.createAuditLog({
          actorUserId: enrollment.userId!,
          action: "certification_issued",
          entity: "certifications",
          entityId: String(cert.id),
          metadata: { courseId: enrollment.courseId, certificateNumber: cert.certificateNumber },
        });

        const certUser = await storage.getUser(enrollment.userId!);
        const certCourse = await storage.getCourse(enrollment.courseId);
        if (certUser && certCourse) {
          const certLocale = await resolveLocale({ userId: certUser.id, courseLanguage: certCourse.language });
          await sendCertificationEmail({
            to: certUser.email,
            userName: certUser.name,
            courseName: certCourse.title,
            certificateNumber: cert.certificateNumber,
            certificationId: cert.id,
            actorUserId: certUser.id,
            locale: certLocale,
          });
        }

        const updatedCert = await storage.getCertification(cert.id);

        return res.json({
          attempt,
          score,
          passed,
          graded,
          allComplete: true,
          certification: updatedCert || cert,
          attemptsRemaining: maxAttempts - (attemptCount + 1),
        });
      }
    }

    return res.json({
      attempt,
      score,
      passed,
      graded,
      allComplete: false,
      attemptsRemaining: maxAttempts - (attemptCount + 1),
    });
  } catch (error) {
    console.error("[Exam] Submit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
