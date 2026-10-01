// Targeted seeder: upserts the canonical online certification courses (EN + ES)
// with their steps and exam questions. Safe to run on any environment — skips
// any course whose slug already exists. Usage:
//   DATABASE_URL=postgres://... npx tsx scripts/seed-online-courses.ts
//
// Pass --refresh to also update EXISTING courses' steps in place (matched by
// title+type, then position+type; see refreshSteps): order/title/config/
// estimatedMinutes are rewritten and each step's questions are replaced. Step rows are never deleted (step_progress
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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertQuestions(tx: Tx | typeof db, stepId: number, questions: NonNullable<(typeof COURSE_STEPS)[number]["questions"]>) {
  for (let j = 0; j < questions.length; j++) {
    const q = questions[j];
    await tx.insert(examQuestions).values({
      stepId,
      order: j + 1,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
    });
  }
}

// Refresh existing steps to match the content file, preserving row identity.
//
// Rows are matched by (title, type) first, then by same position + same type
// (handles title edits). Matching by position alone was unsafe: inserting a
// step (2026-09-28 pre-exam video) would overwrite the exam row with video
// config and orphan its exam_attempts / step_progress. A row is never
// repurposed to a different step type.
//
// Reordering runs in one transaction in two phases because
// (course_id, step_order) is unique: park matched rows at a high offset,
// then write final positions.
async function refreshSteps(courseId: number, slug: string, steps: typeof COURSE_STEPS) {
  await db.transaction(async (tx) => {
    const existingSteps = await tx
      .select()
      .from(courseSteps)
      .where(eq(courseSteps.courseId, courseId))
      .orderBy(asc(courseSteps.stepOrder));

    const claimed = new Set<number>();
    const assignment: (typeof existingSteps[number] | null)[] = steps.map(() => null);

    // Pass 1: exact title + type.
    steps.forEach((def, i) => {
      const row = existingSteps.find((s) => !claimed.has(s.id) && s.title === def.title && s.type === def.type);
      if (row) { assignment[i] = row; claimed.add(row.id); }
    });
    // Pass 2: same position + same type (title was edited).
    steps.forEach((def, i) => {
      if (assignment[i]) return;
      const row = existingSteps.find((s) => !claimed.has(s.id) && s.stepOrder === i + 1 && s.type === def.type);
      if (row) { assignment[i] = row; claimed.add(row.id); }
    });

    const PARK = 100000;
    // Phase 1: park every existing row (claimed or not) out of the way.
    for (const row of existingSteps) {
      await tx.update(courseSteps).set({ stepOrder: PARK + row.stepOrder }).where(eq(courseSteps.id, row.id));
    }

    let updated = 0;
    let created = 0;
    for (let i = 0; i < steps.length; i++) {
      const def = steps[i];
      const row = assignment[i];
      let stepId: number;
      if (row) {
        await tx.update(courseSteps).set({
          stepOrder: i + 1,
          title: def.title,
          type: def.type,
          config: def.config,
          estimatedMinutes: def.estimatedMinutes,
          updatedAt: new Date(),
        }).where(eq(courseSteps.id, row.id));
        stepId = row.id;
        updated++;
      } else {
        const [step] = await tx.insert(courseSteps).values({
          courseId,
          stepOrder: i + 1,
          title: def.title,
          type: def.type,
          config: def.config,
          estimatedMinutes: def.estimatedMinutes,
        }).returning();
        stepId = step.id;
        created++;
      }
      if (def.questions?.length) {
        await tx.delete(examQuestions).where(eq(examQuestions.stepId, stepId));
        await insertQuestions(tx, stepId, def.questions);
      }
    }

    // Unmatched legacy rows: keep (FKs), place after the canonical steps.
    const orphans = existingSteps.filter((s) => !claimed.has(s.id));
    for (let k = 0; k < orphans.length; k++) {
      await tx.update(courseSteps).set({ stepOrder: steps.length + 1 + k }).where(eq(courseSteps.id, orphans[k].id));
    }
    if (orphans.length) {
      console.warn(`[SEED] ${slug}: ${orphans.length} existing step(s) not in the content file were moved to the end (ids ${orphans.map((s) => s.id).join(", ")}). Review in the admin course editor.`);
    }
    console.log(`[SEED] ${slug}: refreshed ${updated} step(s), created ${created}`);
  });
}

async function seedCourse(def: typeof CANONICAL_COURSE, steps: typeof COURSE_STEPS) {
  const existing = await db.select().from(courses).where(eq(courses.slug, def.slug));
  if (existing.length) {
    console.log(`[SEED] ${def.slug} already exists (id ${existing[0].id}) — updating price to ${def.price}`);
    await db.update(courses).set({
      price: def.price,
      // Repair ES rows seeded before language was written (staging bug,
      // 2026-09-03: all 4 ES courses had language='en').
      language: (def as any).language === "es" ? "es" : "en",
    }).where(eq(courses.id, existing[0].id));
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
    // ES content defs carry language: "es" (2026-09-03: without this every ES
    // course row defaulted to 'en' and Spanish certs/emails went out in
    // English).
    language: (def as any).language === "es" ? "es" : "en",
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
      await insertQuestions(db, step.id, stepDef.questions);
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
