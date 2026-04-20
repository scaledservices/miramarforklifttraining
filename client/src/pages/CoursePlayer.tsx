import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryClient } from "@/lib/queryClient";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  Lock,
  PlayCircle,
  FileText,
  ClipboardCheck,
  ChevronLeft,
  Menu,
  X,
  BookOpen,
  Download,
  HelpCircle,
  Award,
  Star,
  ShieldCheck,
} from "lucide-react";
import VideoStep from "@/components/lms/VideoStep";
import ExamStep from "@/components/lms/ExamStep";
import ContentStep from "@/components/lms/ContentStep";
import CheckpointStep from "@/components/lms/CheckpointStep";
import DownloadStep from "@/components/lms/DownloadStep";
import CertificationSuccess from "@/components/lms/CertificationSuccess";
import { industry } from "@shared/config/industry";

interface StepWithProgress {
  id: number;
  courseId: number;
  stepOrder: number;
  title: string;
  type: "content" | "video" | "exam" | "lesson" | "checkpoint" | "download";
  config: any;
  estimatedMinutes: number | null;
  progress: {
    status: string;
    score?: string | null;
    completedAt?: string | null;
  };
}

interface StepDetail {
  step: StepWithProgress;
  questions?: any[];
}

interface EnrollmentData {
  id: number;
  userId: number | null;
  courseId: number;
  status: string;
}

export default function CoursePlayer() {
  const { t } = useTranslation();
  const [, params] = useRoute("/course/:enrollmentId");
  const enrollmentId = params?.enrollmentId;
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCertSuccess, setShowCertSuccess] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const [, navigate] = useLocation();

  const { data: stepsData, isLoading: stepsLoading, refetch: refetchSteps } = useQuery<{
    steps: StepWithProgress[];
    enrollment: EnrollmentData;
  }>({
    queryKey: ["/api/course-player", enrollmentId, "steps"],
    enabled: !!enrollmentId,
  });

  const steps = stepsData?.steps ?? [];
  const enrollment = stepsData?.enrollment;

  useEffect(() => {
    if (steps.length > 0 && !activeStepId) {
      if (enrollment?.status === "completed") {
        setShowCertSuccess(true);
        return;
      }
      const firstIncomplete = steps.find((s) => s.progress.status !== "completed");
      setActiveStepId(firstIncomplete?.id ?? steps[0].id);
    }
  }, [steps, activeStepId, enrollment?.status]);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStepId && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0 });
  }, [activeStepId]);

  const { data: stepDetail, isLoading: stepLoading, error: stepError } = useQuery<StepDetail>({
    queryKey: ["/api/course-player", enrollmentId, "step", String(activeStepId)],
    enabled: !!enrollmentId && !!activeStepId && !showCertSuccess,
  });

  const completedCount = steps.filter((s) => s.progress.status === "completed").length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalMinutes = steps.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);
  const completedMinutes = steps
    .filter((s) => s.progress.status === "completed")
    .reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);
  const remainingMinutes = totalMinutes - completedMinutes;

  const isStepAccessible = (step: StepWithProgress, index: number) => {
    if (index === 0) return true;
    const prevStep = steps[index - 1];
    return prevStep.progress.status === "completed";
  };

  const handleStepComplete = async (result?: any) => {
    if (result?.allComplete && result?.certification) {
      setCertData(result.certification);
      setShowCertSuccess(true);
      setShowCompletionModal(true);
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    }
    await refetchSteps();
    queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    if (!result?.allComplete) {
      const currentIndex = steps.findIndex((s) => s.id === activeStepId);
      if (currentIndex < steps.length - 1) {
        setActiveStepId(steps[currentIndex + 1].id);
      }
    }
  };

  const handleSelectStep = (step: StepWithProgress, index: number) => {
    if (!isStepAccessible(step, index)) return;
    setShowCertSuccess(false);
    setActiveStepId(step.id);
    setSidebarOpen(false);
  };

  const handleResume = () => {
    const firstIncomplete = steps.find((s) => s.progress.status !== "completed");
    if (firstIncomplete) {
      setShowCertSuccess(false);
      setActiveStepId(firstIncomplete.id);
    }
  };

  const getStepIcon = (type: string, status: string, accessible: boolean) => {
    if (status === "completed") return <Check className="h-4 w-4 text-green-500" />;
    if (!accessible) return <Lock className="h-4 w-4 text-muted-foreground" />;
    switch (type) {
      case "video": return <PlayCircle className="h-4 w-4" />;
      case "exam": return <ClipboardCheck className="h-4 w-4 text-red-500" />;
      case "checkpoint": return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case "download": return <Download className="h-4 w-4 text-purple-500" />;
      case "lesson": return <BookOpen className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getModuleGroups = () => {
    const groups: { module: string; steps: { step: StepWithProgress; index: number }[] }[] = [];
    let currentModule = "";
    steps.forEach((step, index) => {
      const config = step.config as any;
      const moduleMatch = (config?.html_content as string)?.match?.(/class="lesson-content"/);
      const stepModule = getStepModule(step, index);
      if (stepModule !== currentModule) {
        currentModule = stepModule;
        groups.push({ module: currentModule, steps: [] });
      }
      groups[groups.length - 1]?.steps.push({ step, index });
    });
    return groups;
  };

  const getStepModule = (step: StepWithProgress, index: number): string => {
    const moduleMap: Record<number, string> = {};
    let currentMod = "Course";
    let modNum = 0;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (i === 0) currentMod = t("coursePlayer.moduleWelcome");
      else if (i === 3) { currentMod = t("coursePlayer.moduleBasics"); modNum = 1; }
      else if (i === 6) { currentMod = t("coursePlayer.moduleStability"); modNum = 2; }
      else if (i === 10) { currentMod = t("coursePlayer.moduleInspection"); modNum = 3; }
      else if (i === 14) { currentMod = t("coursePlayer.moduleDriving"); modNum = 4; }
      else if (i === 19) { currentMod = t("coursePlayer.moduleRamps"); modNum = 5; }
      else if (i === 23) { currentMod = t("coursePlayer.moduleParking"); modNum = 6; }
      else if (i === 26) { currentMod = t("coursePlayer.moduleSiteSpecific"); modNum = 7; }
      else if (i === 30) { currentMod = t("coursePlayer.moduleFinalExam"); modNum = 8; }
      moduleMap[i] = currentMod;
    }
    return moduleMap[index] || "Course";
  };

  if (stepsLoading) {
    return (
      <div className="min-h-screen bg-background p-4" data-testid="course-player-loading">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-6" />
        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const moduleGroups = getModuleGroups();

  const stepNav = (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {remainingMinutes > 0 && (
          <div className="px-3 py-2 mb-2 text-xs text-muted-foreground" data-testid="text-time-remaining">
            {t("coursePlayer.minRemaining", { minutes: remainingMinutes })}
          </div>
        )}
        {steps.length > 5 && (
          <>
            {(() => {
              let currentModLabel = "";
              return steps.map((step, index) => {
                const accessible = isStepAccessible(step, index);
                const isActive = step.id === activeStepId && !showCertSuccess;
                const modLabel = getStepModule(step, index);
                const showModHeader = modLabel !== currentModLabel;
                if (showModHeader) currentModLabel = modLabel;

                return (
                  <div key={step.id}>
                    {showModHeader && (
                      <div className="px-3 py-1.5 mt-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border" data-testid={`text-module-${index}`}>
                        {modLabel}
                      </div>
                    )}
                    <button
                      onClick={() => handleSelectStep(step, index)}
                      disabled={!accessible}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : accessible
                            ? "hover:bg-muted"
                            : "opacity-50 cursor-not-allowed"
                      }`}
                      data-testid={`button-step-${step.id}`}
                    >
                      {getStepIcon(step.type, step.progress.status, accessible)}
                      <span className="flex-1 truncate text-xs">{step.title}</span>
                    </button>
                  </div>
                );
              });
            })()}
          </>
        )}
        {steps.length <= 5 && steps.map((step, index) => {
          const accessible = isStepAccessible(step, index);
          const isActive = step.id === activeStepId && !showCertSuccess;
          return (
            <button
              key={step.id}
              onClick={() => handleSelectStep(step, index)}
              disabled={!accessible}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : accessible
                    ? "hover:bg-muted"
                    : "opacity-50 cursor-not-allowed"
              }`}
              data-testid={`button-step-${step.id}`}
            >
              {getStepIcon(step.type, step.progress.status, accessible)}
              <span className="flex-1 truncate">{step.title}</span>
              {step.progress.status === "completed" && (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="course-player-page">
      <div className="bg-primary px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="icon" variant="ghost" className="text-primary-foreground" data-testid="button-back-dashboard">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-primary-foreground/80" data-testid="text-progress-label">
                {t("coursePlayer.stepsComplete", { completed: completedCount, total: totalCount })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <Progress value={progressPercent} className="flex-1 h-2" data-testid="progress-bar-course" />
            <span className="text-sm font-medium text-primary-foreground whitespace-nowrap" data-testid="text-progress-percent">
              {progressPercent}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showCertSuccess && enrollment?.status !== "completed" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleResume}
                className="hidden md:inline-flex"
                data-testid="button-resume-training"
              >
                {t("coursePlayer.resumeTraining")}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-foreground md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-steps"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {sidebarOpen && (
          <div className="md:hidden border-b bg-card" data-testid="mobile-step-nav">
            {stepNav}
          </div>
        )}

        <aside className="hidden md:block w-[280px] shrink-0 border-r bg-card min-h-[calc(100vh-56px)]" data-testid="desktop-step-nav">
          {stepNav}
        </aside>

        <div ref={contentRef} className="flex-1 p-4 md:p-6 max-w-4xl overflow-y-auto" data-testid="step-content-area">
          {showCertSuccess && !showCompletionModal ? (
            <CertificationSuccess
              certification={certData}
              enrollmentId={parseInt(enrollmentId || "0")}
            />
          ) : stepLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : stepError ? (
            <div className="text-center py-12" data-testid="step-error">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">{t("coursePlayer.stepLocked")}</h2>
              <p className="text-muted-foreground">{t("coursePlayer.stepLockedDesc")}</p>
            </div>
          ) : stepDetail?.step ? (
            (() => {
              const stepsListEntry = steps.find((s) => s.id === stepDetail.step.id);
              const stepWithProgress = {
                ...stepDetail.step,
                progress: stepsListEntry?.progress || { status: "not_started" },
              };
              return (
                <>
                  {stepWithProgress.type === "video" && (
                    <VideoStep
                      step={stepWithProgress}
                      enrollmentId={parseInt(enrollmentId || "0")}
                      onComplete={handleStepComplete}
                    />
                  )}
                  {(stepWithProgress.type === "exam") && (
                    <ExamStep
                      step={stepWithProgress}
                      questions={stepDetail.questions || []}
                      enrollmentId={parseInt(enrollmentId || "0")}
                      onComplete={handleStepComplete}
                    />
                  )}
                  {(stepWithProgress.type === "checkpoint") && (
                    <CheckpointStep
                      step={stepWithProgress}
                      questions={stepDetail.questions || []}
                      enrollmentId={parseInt(enrollmentId || "0")}
                      onComplete={handleStepComplete}
                    />
                  )}
                  {(stepWithProgress.type === "content" || stepWithProgress.type === "lesson") && (
                    <ContentStep
                      step={stepWithProgress}
                      enrollmentId={parseInt(enrollmentId || "0")}
                      onComplete={handleStepComplete}
                    />
                  )}
                  {stepWithProgress.type === "download" && (
                    <DownloadStep
                      step={stepWithProgress}
                      enrollmentId={parseInt(enrollmentId || "0")}
                      onComplete={handleStepComplete}
                    />
                  )}
                </>
              );
            })()
          ) : null}
        </div>
      </div>

      <Dialog open={showCompletionModal} onOpenChange={(open) => {
        setShowCompletionModal(open);
        if (!open) {
          setShowCertSuccess(true);
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-course-complete">
          <DialogHeader className="text-center items-center">
            <div className="relative inline-block mb-2">
              <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                <Award className="h-10 w-10 text-accent" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Star className="h-5 w-5 text-accent fill-accent" />
              </div>
              <div className="absolute -top-2 -left-2">
                <Star className="h-3.5 w-3.5 text-accent fill-accent" />
              </div>
            </div>
            <DialogTitle className="text-2xl" data-testid="text-completion-title">
              {t("certSuccess.title")}
            </DialogTitle>
            <DialogDescription className="text-base" data-testid="text-completion-description">
              {t("certSuccess.modalSubtitle")}
            </DialogDescription>
          </DialogHeader>

          {certData && (
            <div className="flex items-center justify-center gap-2 py-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium" data-testid="text-modal-cert-number">
                Certificate #{certData.certificateNumber}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-2">
            {certData && (
              <Button
                className="w-full"
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate(`/certifications/${certData.id}`);
                }}
                data-testid="button-view-certificate"
              >
                <Award className="h-4 w-4 mr-2" />
                {t("certSuccess.viewYourCertificate")}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowCompletionModal(false);
                setShowCertSuccess(true);
              }}
              data-testid="button-view-details"
            >
              <FileText className="h-4 w-4 mr-2" />
              {t("certSuccess.viewDetailsNextSteps")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
