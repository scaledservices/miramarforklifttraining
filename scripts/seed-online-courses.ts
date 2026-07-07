// Targeted seeder: upserts the canonical online certification courses (EN + ES)
// with their steps and exam questions. Safe to run on any environment — skips
// any course whose slug already exists. Usage:
//   DATABASE_URL=postgres://... npx tsx scripts/seed-online-courses.ts
import { db } from "../server/db";
import { courses, courseSteps, examQuestions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { CANONICAL_COURSE, COURSE_STEPS } from "./course-content";
import { CANONICAL_COURSE_ES, COURSE_STEPS_ES } from "./course-content-es";

async function seedCourse(def: typeof CANONICAL_COURSE, steps: typeof COURSE_STEPS) {
  const existing = await db.select().from(courses).where(eq(courses.slug, def.slug));
  if (existing.length) {
    console.log(`[SEED] ${def.slug} already exists (id ${existing[0].id}) — updating price to ${def.price}`);
    await db.update(courses).set({ price: def.price }).where(eq(courses.id, existing[0].id));
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
      for (let j = 0; j < stepDef.questions.length; j++) {
        const q = stepDef.questions[j];
        await db.insert(examQuestions).values({
          stepId: step.id,
          questionOrder: j + 1,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
        });
      }
    }
  }
  console.log(`[SEED] ${def.slug}: ${steps.length} steps seeded`);
  return course.id;
}

const enId = await seedCourse(CANONICAL_COURSE, COURSE_STEPS);
const esId = await seedCourse(CANONICAL_COURSE_ES as any, COURSE_STEPS_ES as any);
console.log(`[SEED] done. EN course ${enId}, ES course ${esId}`);
process.exit(0);
