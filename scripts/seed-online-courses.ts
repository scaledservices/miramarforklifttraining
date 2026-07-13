// Targeted seeder: upserts the canonical online certification courses (EN + ES)
// with their steps and exam questions. Safe to run on any environment — skips
// any course whose slug already exists. Usage:
//   DATABASE_URL=postgres://... npx tsx scripts/seed-online-courses.ts
//
// Pass --refresh to also update EXISTING courses' steps in place (matched by
// stepOrder): title/type/config/estimatedMinutes are overwritten and each
// step's questions are replaced. Step rows are never deleted (step_progress
// and exam_attempts reference them), so enrollment progress is preserved.
//   DATABASE_URL=postgres://... npx tsx scripts/seed-online-courses.ts --refresh
import { db } from "../server/db";
import { courses, courseSteps, examQuestions } from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { CANONICAL_COURSE, COURSE_STEPS } from "./course-content";
import { CANONICAL_COURSE_ES, COURSE_STEPS_ES } from "./course-content-es";
import { CANONICAL_COURSE as AERIAL_COURSE, COURSE_STEPS as AERIAL_STEPS } from "./course-content-aerial";
import { CANONICAL_COURSE_ES as AERIAL_COURSE_ES, COURSE_STEPS_ES as AERIAL_STEPS_ES } from "./course-content-aerial-es";
import { CANONICAL_COURSE as FORKLIFT_TTT_COURSE, COURSE_STEPS as FORKLIFT_TTT_STEPS } from "./course-content-forklift-ttt";
import { CANONICAL_COURSE_ES as FORKLIFT_TTT_COURSE_ES, COURSE_STEPS_ES as FORKLIFT_TTT_STEPS_ES } from "./course-content-forklift-ttt-es";
import { CANONICAL_COURSE as AERIAL_TTT_COURSE, COURSE_STEPS as AERIAL_TTT_STEPS } from "./course-content-aerial-ttt";
import { CANONICAL_COURSE_ES as AERIAL_TTT_COURSE_ES, COURSE_STEPS_ES as AERIAL_TTT_STEPS_ES } from "./course-content-aerial-ttt-es";

const REFRESH = process.argv.includes("--refresh");

async function insertQuestions(stepId: number, questions: NonNullable<(typeof COURSE_STEPS)[number]["questions"]>) {
  for (let j = 0; j < questions.length; j++) {
    const q = questions[j];
    await db.insert(examQuestions).values({
      stepId,
      questionOrder: j + 1,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
    });
  }
}

async function refreshSteps(courseId: number, slug: string, steps: typeof COURSE_STEPS) {
  const existingSteps = await db
    .select()
    .from(courseSteps)
    .where(eq(courseSteps.courseId, courseId))
    .orderBy(asc(courseSteps.stepOrder));

  let updated = 0;
  let created = 0;
  for (let i = 0; i < steps.length; i++) {
    const stepDef = steps[i];
    const existing = existingSteps.find((s) => s.stepOrder === i + 1);
    let stepId: number;
    if (existing) {
      await db.update(courseSteps).set({
        title: stepDef.title,
        type: stepDef.type,
        config: stepDef.config,
        estimatedMinutes: stepDef.estimatedMinutes,
      }).where(eq(courseSteps.id, existing.id));
      stepId = existing.id;
      updated++;
    } else {
      const [step] = await db.insert(courseSteps).values({
        courseId,
        stepOrder: i + 1,
        title: stepDef.title,
        type: stepDef.type,
        config: stepDef.config,
        estimatedMinutes: stepDef.estimatedMinutes,
      }).returning();
      stepId = step.id;
      created++;
    }
    if (stepDef.questions?.length) {
      await db.delete(examQuestions).where(eq(examQuestions.stepId, stepId));
      await insertQuestions(stepId, stepDef.questions);
    }
  }
  const extra = existingSteps.filter((s) => s.stepOrder > steps.length);
  if (extra.length) {
    console.warn(`[SEED] ${slug}: ${extra.length} existing step(s) beyond position ${steps.length} left untouched (ids ${extra.map((s) => s.id).join(", ")})`);
  }
  console.log(`[SEED] ${slug}: refreshed ${updated} step(s), created ${created}`);
}

async function seedCourse(def: typeof CANONICAL_COURSE, steps: typeof COURSE_STEPS) {
  const existing = await db.select().from(courses).where(eq(courses.slug, def.slug));
  if (existing.length) {
    console.log(`[SEED] ${def.slug} already exists (id ${existing[0].id}) — updating price to ${def.price}`);
    await db.update(courses).set({ price: def.price }).where(eq(courses.id, existing[0].id));
    if (REFRESH) {
      await refreshSteps(existing[0].id, def.slug, steps);
    }
    return existing[0].id;
  }
  const [course] = await db.insert(courses).values({
    title: def.title,
    slug: def.slug,
    description: def.description,
    category: def.category,
    price: def.price,
    isActive: true,
    thumbnailUrl: "/images/training/forklift-hero.svg",
  }).returning();
  console.log(`[SEED] created course ${def.slug} (id ${course.id})`);

  for (let i = 0; i < steps.length; i++) {
    const stepDef = steps[i];
    const [step] = await db.insert(courseSteps).values({
      courseId: course.id,
      stepOrder: i + 1,
      title: stepDef.title,
      type: stepDef.type,
      config: stepDef.config,
      estimatedMinutes: stepDef.estimatedMinutes,
    }).returning();
    if (stepDef.questions?.length) {
      await insertQuestions(step.id, stepDef.questions);
    }
  }
  console.log(`[SEED] ${def.slug}: ${steps.length} steps seeded`);
  return course.id;
}

const enId = await seedCourse(CANONICAL_COURSE, COURSE_STEPS);
const esId = await seedCourse(CANONICAL_COURSE_ES as any, COURSE_STEPS_ES as any);
await seedCourse(AERIAL_COURSE as any, AERIAL_STEPS as any);
await seedCourse(AERIAL_COURSE_ES as any, AERIAL_STEPS_ES as any);
await seedCourse(FORKLIFT_TTT_COURSE as any, FORKLIFT_TTT_STEPS as any);
await seedCourse(FORKLIFT_TTT_COURSE_ES as any, FORKLIFT_TTT_STEPS_ES as any);
await seedCourse(AERIAL_TTT_COURSE as any, AERIAL_TTT_STEPS as any);
await seedCourse(AERIAL_TTT_COURSE_ES as any, AERIAL_TTT_STEPS_ES as any);
console.log(`[SEED] done. EN course ${enId}, ES course ${esId}`);
process.exit(0);
