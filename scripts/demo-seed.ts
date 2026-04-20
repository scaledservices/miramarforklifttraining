import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, pool } from "../server/db";
import {
  users, groups, groupMembers, courses, courseSteps, examQuestions,
  orders, orderItems, payments, enrollments, stepProgress,
  examAttempts, certifications, auditLogs, emailOutbox, webhookEvents,
  certCardOrders, contactSubmissions,
} from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import { generateCertificatePdf } from "../server/certificate-pdf";
import { CANONICAL_COURSE, COURSE_STEPS } from "./course-content";
import { CANONICAL_COURSE_ES, COURSE_STEPS_ES } from "./course-content-es";

const DEMO_PASSWORD = "DemoPass!234";

export async function wipeDemoData() {
  console.log("[SEED] Wiping existing data...");
  await db.delete(emailOutbox);
  await db.delete(auditLogs);
  await db.delete(certCardOrders);
  await db.delete(certifications);
  await db.delete(examAttempts);
  await db.delete(stepProgress);
  await db.delete(enrollments);
  await db.delete(payments);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(examQuestions);
  await db.delete(courseSteps);
  await db.delete(courses);
  await db.delete(groupMembers);
  await db.delete(groups);
  await db.delete(webhookEvents);
  await db.delete(contactSubmissions);
  await db.delete(users);

  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS order_number_seq`);
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS invoice_number_seq`);
  await db.execute(sql`ALTER SEQUENCE order_number_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE invoice_number_seq RESTART WITH 1`);
  console.log("[SEED] Data wiped and sequences reset.");
}

export async function seedDemoData() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  console.log("[SEED] Creating users...");
  const [adminUser] = await db.insert(users).values({
    email: "admin@forkliftcertified.training",
    passwordHash,
    name: "Alex Admin",
    phone: "555-000-0001",
    role: "super_admin",
  }).returning();

  const [groupAdminUser] = await db.insert(users).values({
    email: "group@forkliftcertified.training",
    passwordHash,
    name: "Grace GroupAdmin",
    phone: "555-000-0002",
    role: "group_admin",
  }).returning();

  const [individualUser] = await db.insert(users).values({
    email: "user@forkliftcertified.training",
    passwordHash,
    name: "Ulysses User",
    phone: "555-000-0003",
    role: "individual",
  }).returning();

  const [memberUser] = await db.insert(users).values({
    email: "member1@forkliftcertified.training",
    passwordHash,
    name: "Mike Member",
    phone: "555-000-0004",
    role: "individual",
  }).returning();

  const [certifiedUser] = await db.insert(users).values({
    email: "certified@forkliftcertified.training",
    passwordHash,
    name: "Clara Certified",
    phone: "555-000-0005",
    role: "individual",
  }).returning();

  console.log("[SEED] Creating canonical course...");
  const [courseA] = await db.insert(courses).values({
    title: CANONICAL_COURSE.title,
    slug: CANONICAL_COURSE.slug,
    description: CANONICAL_COURSE.description,
    category: CANONICAL_COURSE.category,
    price: CANONICAL_COURSE.price,
    isActive: true,
    thumbnailUrl: "/images/training/forklift-hero.svg",
  }).returning();

  const [courseB] = await db.insert(courses).values({
    title: "Forklift Safety Refresher",
    slug: "forklift-safety-refresher",
    description: "Refresher course for experienced operators. Quick review of safety protocols and updated OSHA guidelines. Perfect for 3-year recertification requirements.",
    category: "forklift",
    price: "29.99",
    isActive: true,
    thumbnailUrl: null,
  }).returning();

  console.log("[SEED] Creating course steps and questions...");
  const stepIds: number[] = [];
  const examStepId: { id: number; questionIds: number[] } = { id: 0, questionIds: [] };

  for (let i = 0; i < COURSE_STEPS.length; i++) {
    const stepDef = COURSE_STEPS[i];
    const [step] = await db.insert(courseSteps).values({
      courseId: courseA.id,
      stepOrder: i + 1,
      title: stepDef.title,
      type: stepDef.type,
      config: stepDef.config,
      estimatedMinutes: stepDef.estimatedMinutes,
    }).returning();
    stepIds.push(step.id);

    if (stepDef.questions && stepDef.questions.length > 0) {
      for (let j = 0; j < stepDef.questions.length; j++) {
        const q = stepDef.questions[j];
        const [question] = await db.insert(examQuestions).values({
          stepId: step.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          order: j + 1,
        }).returning();

        if (stepDef.type === "exam") {
          if (examStepId.id === 0) examStepId.id = step.id;
          examStepId.questionIds.push(question.id);
        }
      }
    }
  }

  console.log(`[SEED] Created ${stepIds.length} steps for canonical course`);

  const refresherSteps = [
    { title: "Safety Refresher Overview", type: "content" as const, config: { html_content: `<h2>Forklift Safety Refresher</h2><p>Welcome to the safety refresher course. This abbreviated course is designed for experienced operators who need to recertify per OSHA's 3-year requirement.</p><h3>Quick Review Topics</h3><ul><li>Updated OSHA guidelines</li><li>Common accident scenarios and prevention</li><li>Equipment changes and new safety features</li></ul>` }, estimatedMinutes: 5 },
    { title: "Refresher Quiz", type: "exam" as const, config: { passing_score: 80, max_attempts: 3, randomize_questions: true }, estimatedMinutes: 10 },
  ];
  
  const refresherQuestions = [
    { question: "How far should forks be lowered when parking?", options: ["Knee height", "Waist height", "Fully to ground", "6 inches"], correct: "Fully to ground", explanation: "Forks must be lowered completely flat on the ground when parking." },
    { question: "Who is responsible for forklift training?", options: ["The operator", "The employer", "OSHA", "The manufacturer"], correct: "The employer", explanation: "Under 29 CFR 1910.178(l), the employer is responsible for ensuring operators are trained." },
    { question: "What is the minimum age to operate a forklift?", options: ["16", "18", "21", "No minimum"], correct: "18", explanation: "Operators must be at least 18 years old per OSHA regulations." },
    { question: "When going up a ramp with a load, you should:", options: ["Drive forward with load uphill", "Drive in reverse", "Drive sideways", "Speed up"], correct: "Drive forward with load uphill", explanation: "When ascending a ramp with a load, travel with the load pointed uphill (forward)." },
  ];

  for (let i = 0; i < refresherSteps.length; i++) {
    const s = refresherSteps[i];
    const [step] = await db.insert(courseSteps).values({
      courseId: courseB.id,
      stepOrder: i + 1,
      title: s.title,
      type: s.type,
      config: s.config,
      estimatedMinutes: s.estimatedMinutes,
    }).returning();

    if (s.type === "exam") {
      for (let j = 0; j < refresherQuestions.length; j++) {
        const q = refresherQuestions[j];
        await db.insert(examQuestions).values({
          stepId: step.id,
          question: q.question,
          type: "mcq_single",
          options: q.options,
          correctAnswers: q.correct,
          explanation: q.explanation,
          order: j + 1,
        });
      }
    }
  }

  console.log("[SEED] Creating Spanish course...");
  const [courseES] = await db.insert(courses).values({
    title: CANONICAL_COURSE_ES.title,
    slug: CANONICAL_COURSE_ES.slug,
    description: CANONICAL_COURSE_ES.description,
    category: CANONICAL_COURSE_ES.category,
    price: CANONICAL_COURSE_ES.price,
    isActive: true,
    language: "es",
    thumbnailUrl: "/images/training/forklift-hero.svg",
  }).returning();

  for (let i = 0; i < COURSE_STEPS_ES.length; i++) {
    const stepDef = COURSE_STEPS_ES[i];
    const [step] = await db.insert(courseSteps).values({
      courseId: courseES.id,
      stepOrder: i + 1,
      title: stepDef.title,
      type: stepDef.type,
      config: stepDef.config,
      estimatedMinutes: stepDef.estimatedMinutes,
    }).returning();

    if (stepDef.questions && stepDef.questions.length > 0) {
      for (let j = 0; j < stepDef.questions.length; j++) {
        const q = stepDef.questions[j];
        await db.insert(examQuestions).values({
          stepId: step.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswers: q.correctAnswers,
          explanation: q.explanation,
          order: j + 1,
        });
      }
    }
  }

  console.log(`[SEED] Created ${COURSE_STEPS_ES.length} steps for Spanish course`);

  console.log("[SEED] Creating group...");
  const [group] = await db.insert(groups).values({
    name: "Acme Warehouse Corp",
    adminUserId: groupAdminUser.id,
  }).returning();

  const inviteToken1 = crypto.randomUUID();
  const inviteToken2 = crypto.randomUUID();
  const inviteToken3 = crypto.randomUUID();

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: memberUser.id,
    email: memberUser.email,
    name: memberUser.name,
    inviteToken: inviteToken1,
    acceptedAt: new Date(),
    invitedByUserId: groupAdminUser.id,
  });

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: certifiedUser.id,
    email: certifiedUser.email,
    name: certifiedUser.name,
    inviteToken: inviteToken2,
    acceptedAt: new Date(),
    invitedByUserId: groupAdminUser.id,
  });

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: null,
    email: "pending@example.com",
    name: "Pending Person",
    inviteToken: inviteToken3,
    invitedByUserId: groupAdminUser.id,
  });

  console.log("[SEED] Creating group seat order...");
  const orderNumResult = await db.execute(
    sql`SELECT 'FC-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('order_number_seq')::text, 6, '0') as order_number`
  );
  const groupOrderNumber = orderNumResult.rows[0].order_number;

  const [groupOrder] = await db.insert(orders).values({
    orderNumber: groupOrderNumber,
    userId: groupAdminUser.id,
    groupId: group.id,
    total: "299.95",
    status: "paid",
    refundPolicyAccepted: true,
  }).returning();

  await db.insert(orderItems).values({
    orderId: groupOrder.id,
    courseId: courseA.id,
    quantity: 5,
    unitPrice: "59.99",
  });

  await db.insert(payments).values({
    orderId: groupOrder.id,
    provider: "demo_sandbox",
    providerTransactionId: `DEMO-GROUP-${Date.now()}`,
    status: "approved",
    amount: "299.95",
    rawResponse: { demo: true, note: "Seeded group order payment" },
  });

  console.log("[SEED] Creating 5 group enrollments (2 assigned, 3 unassigned)...");
  const [enrollMember1] = await db.insert(enrollments).values({
    userId: memberUser.id,
    courseId: courseA.id,
    orderId: groupOrder.id,
    status: "active",
    assignedByUserId: groupAdminUser.id,
  }).returning();

  const [enrollCertified] = await db.insert(enrollments).values({
    userId: certifiedUser.id,
    courseId: courseA.id,
    orderId: groupOrder.id,
    status: "completed",
    assignedByUserId: groupAdminUser.id,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  }).returning();

  await db.insert(enrollments).values({
    userId: null, courseId: courseA.id, orderId: groupOrder.id, status: "active",
  });
  await db.insert(enrollments).values({
    userId: null, courseId: courseA.id, orderId: groupOrder.id, status: "active",
  });
  await db.insert(enrollments).values({
    userId: null, courseId: courseA.id, orderId: groupOrder.id, status: "active",
  });

  console.log("[SEED] Adding partial progress for member1 (first 3 steps completed)...");
  for (let i = 0; i < Math.min(3, stepIds.length); i++) {
    await db.insert(stepProgress).values({
      enrollmentId: enrollMember1.id,
      stepId: stepIds[i],
      status: "completed",
      completedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
    });
  }
  if (stepIds.length > 3) {
    await db.insert(stepProgress).values({
      enrollmentId: enrollMember1.id,
      stepId: stepIds[3],
      status: "in_progress",
    });
  }

  console.log("[SEED] Adding completed progress + certification for certifiedUser...");
  for (let i = 0; i < stepIds.length; i++) {
    await db.insert(stepProgress).values({
      enrollmentId: enrollCertified.id,
      stepId: stepIds[i],
      status: "completed",
      score: (COURSE_STEPS[i].type === "exam" || COURSE_STEPS[i].type === "checkpoint") ? "90" : undefined,
      completedAt: new Date(Date.now() - (stepIds.length - i + 5) * 24 * 60 * 60 * 1000),
    });
  }

  if (examStepId.id && examStepId.questionIds.length > 0) {
    const gradedAnswers = examStepId.questionIds.map((qId) => ({
      questionId: qId,
      userAnswer: "correct",
      correct: true,
      explanation: "Demo answer",
    }));

    await db.insert(examAttempts).values({
      enrollmentId: enrollCertified.id,
      stepId: examStepId.id,
      attemptNumber: 1,
      score: "90",
      passed: true,
      answers: gradedAnswers,
      durationSeconds: 480,
    });
  }

  const certNumber = `CERT-DEMO-${Date.now().toString(36).toUpperCase()}`;

  const [cert] = await db.insert(certifications).values({
    enrollmentId: enrollCertified.id,
    userId: certifiedUser.id,
    courseId: courseA.id,
    certificateNumber: certNumber,
    status: "issued",
    expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
  }).returning();

  try {
    await generateCertificatePdf(cert.id);
    console.log(`[SEED] Certificate PDF generated for ${certNumber}`);
  } catch (err) {
    console.error("[SEED] PDF generation error (non-fatal):", err);
  }

  console.log("[SEED] Creating individual order for user (pending - available for demo purchase)...");
  const indOrderNumResult = await pool.query(
    `SELECT 'FC-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('order_number_seq')::text, 6, '0') as order_number`
  );
  const indOrderNumber = indOrderNumResult.rows[0].order_number;

  const [indOrder] = await db.insert(orders).values({
    orderNumber: indOrderNumber,
    userId: individualUser.id,
    groupId: null,
    total: "59.99",
    status: "pending",
    refundPolicyAccepted: true,
  }).returning();

  await db.insert(orderItems).values({
    orderId: indOrder.id,
    courseId: courseA.id,
    quantity: 1,
    unitPrice: "59.99",
  });

  console.log("[SEED] Writing audit logs...");
  await db.insert(auditLogs).values([
    { actorUserId: adminUser.id, action: "demo_seeded", entity: "system", entityId: "0", metadata: { note: "Demo data seeded" } },
    { actorUserId: groupAdminUser.id, action: "payment_completed", entity: "orders", entityId: String(groupOrder.id), metadata: { orderNumber: groupOrderNumber, amount: "299.95" } },
    { actorUserId: groupAdminUser.id, action: "seat_assigned", entity: "enrollments", entityId: String(enrollMember1.id), metadata: { userId: memberUser.id } },
    { actorUserId: groupAdminUser.id, action: "seat_assigned", entity: "enrollments", entityId: String(enrollCertified.id), metadata: { userId: certifiedUser.id } },
    { actorUserId: certifiedUser.id, action: "certification_issued", entity: "certifications", entityId: String(cert.id), metadata: { certificateNumber: certNumber, courseId: courseA.id } },
  ]);

  console.log("\n[SEED] ========== DEMO DATA SEEDED ==========");
  console.log(`  Admin:       admin@forkliftcertified.training / ${DEMO_PASSWORD}`);
  console.log(`  Group Admin: group@forkliftcertified.training / ${DEMO_PASSWORD}`);
  console.log(`  Individual:  user@forkliftcertified.training  / ${DEMO_PASSWORD}`);
  console.log(`  Member:      member1@forkliftcertified.training / ${DEMO_PASSWORD}`);
  console.log(`  Certified:   certified@forkliftcertified.training / ${DEMO_PASSWORD}`);
  console.log(`  Group:       Acme Warehouse Corp (ID: ${group.id})`);
  console.log(`  Course A:    ${courseA.title} (slug: ${courseA.slug})`);
  console.log(`  Course B:    ${courseB.title} (slug: ${courseB.slug})`);
  console.log(`  Steps:       ${stepIds.length} steps seeded for canonical course`);
  console.log(`  Group Order: ${groupOrderNumber} (paid, 5 seats)`);
  console.log(`  Ind. Order:  ${indOrderNumber} (pending, ready for demo checkout)`);
  console.log(`  Pending invite token: ${inviteToken3}`);
  console.log(`  Certificate: ${certNumber} (verify at /verify/${certNumber})`);
  console.log("  ============================================\n");

  return {
    adminUser, groupAdminUser, individualUser, memberUser, certifiedUser,
    courseA, courseB, group, groupOrder, indOrder, cert, certNumber,
    inviteToken3,
  };
}

if (process.argv[1]?.includes("demo-seed")) {
  (async () => {
    try {
      await wipeDemoData();
      await seedDemoData();
      console.log("[SEED] Done.");
      process.exit(0);
    } catch (err) {
      console.error("[SEED] Fatal error:", err);
      process.exit(1);
    }
  })();
}
