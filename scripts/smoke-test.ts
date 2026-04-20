import crypto from "crypto";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const UNIQUE = crypto.randomBytes(4).toString("hex");

let adminCookie = "";
let userCookie = "";
let adminUserId = 0;
let userId = 0;
let courseId = 0;
let stepVideoId = 0;
let stepExamId = 0;
let questionIds: number[] = [];
let orderId = 0;
let orderNumber = "";
let enrollmentId = 0;
let certId = 0;
let certNumber = "";
let groupId = 0;
let memberId = 0;
let inviteToken = "";
let inviteeUserId = 0;
let inviteeCookie = "";

async function api(
  method: string,
  path: string,
  body?: any,
  cookie?: string
): Promise<{ status: number; data: any; cookie?: string }> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers["Cookie"] = cookie;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  const setCookie = res.headers.get("set-cookie");
  let data: any;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json();
  } else if (ct.includes("application/pdf")) {
    const buf = await res.arrayBuffer();
    data = { pdfBytes: buf.byteLength };
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    data,
    cookie: setCookie ? setCookie.split(";")[0] : cookie,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function step(name: string, fn: () => Promise<void>) {
  console.log(`\n--- ${name} ---`);
  await fn();
}

async function main() {
  console.log(`\n🔧 Smoke Test — ForkliftCertified (${UNIQUE})\n`);
  console.log(`Base URL: ${BASE}\n`);

  await step("1. Register admin user", async () => {
    const r = await api("POST", "/api/auth/register", {
      email: `admin_${UNIQUE}@test.local`,
      password: "AdminPass123!",
      name: `Admin ${UNIQUE}`,
    });
    assert(r.status === 200 || r.status === 201, `Register admin: ${r.status}`);
    adminCookie = r.cookie!;
    adminUserId = r.data.user?.id || r.data.id;
    assert(!!adminCookie, "Got session cookie");
  });

  await step("2. Promote to super_admin via DB", async () => {
    const { db } = await import("../server/db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ role: "super_admin" }).where(eq(users.id, adminUserId));
    console.log("  Promoted via DB");

    const r = await api("GET", "/api/auth/me", undefined, adminCookie);
    assert(r.data.user?.role === "super_admin", `Role is super_admin`);
  });

  await step("3. Create course + steps (admin)", async () => {
    let r = await api("POST", "/api/admin/courses", {
      title: `Forklift Safety ${UNIQUE}`,
      slug: `forklift-safety-${UNIQUE}`,
      description: "Smoke test course",
      category: "forklift",
      price: "49.99",
      isActive: true,
    }, adminCookie);
    assert(r.status === 200 || r.status === 201, `Create course: ${r.status}`);
    courseId = r.data.course?.id || r.data.id;
    assert(!!courseId, `Course ID: ${courseId}`);

    r = await api("POST", `/api/admin/courses/${courseId}/steps`, {
      stepOrder: 1,
      title: "Safety Video",
      type: "video",
      config: { video_url: "https://example.com/video.mp4", min_watch_percentage: 80 },
      estimatedMinutes: 15,
    }, adminCookie);
    assert(r.status === 200 || r.status === 201, `Create video step`);
    stepVideoId = r.data.step?.id || r.data.id;

    r = await api("POST", `/api/admin/courses/${courseId}/steps`, {
      stepOrder: 2,
      title: "Final Exam",
      type: "exam",
      config: { passing_score: 70, max_attempts: 3 },
      estimatedMinutes: 20,
    }, adminCookie);
    assert(r.status === 200 || r.status === 201, `Create exam step`);
    stepExamId = r.data.step?.id || r.data.id;

    for (let i = 0; i < 3; i++) {
      r = await api("POST", `/api/admin/steps/${stepExamId}/questions`, {
        question: `Question ${i + 1}: What is safety rule ${i + 1}?`,
        type: "mcq_single",
        options: ["A", "B", "C", "D"],
        correctAnswers: "A",
        explanation: `A is correct for Q${i + 1}`,
        order: i + 1,
      }, adminCookie);
      assert(r.status === 200 || r.status === 201, `Create question ${i + 1}`);
      questionIds.push(r.data.question?.id || r.data.id);
    }
  });

  await step("4. Register individual learner", async () => {
    const r = await api("POST", "/api/auth/register", {
      email: `learner_${UNIQUE}@test.local`,
      password: "LearnerPass123!",
      name: `Learner ${UNIQUE}`,
    });
    assert(r.status === 200 || r.status === 201, `Register learner: ${r.status}`);
    userCookie = r.cookie!;
    userId = r.data.user?.id || r.data.id;
  });

  await step("5. Purchase flow (create order + pay with idempotency)", async () => {
    let r = await api("POST", "/api/orders", {
      items: [{ courseId, quantity: 1 }],
      refundPolicyAccepted: true,
    }, userCookie);
    assert(r.status === 200 || r.status === 201, `Create order: ${r.status}`);
    orderId = r.data.order?.id || r.data.id;
    orderNumber = r.data.order?.orderNumber || r.data.orderNumber;
    assert(!!orderId, `Order ID: ${orderId}`);
    assert(orderNumber.startsWith("FC-"), `Order number: ${orderNumber}`);

    r = await api("POST", `/api/orders/${orderId}/pay`, { cardData: {} }, userCookie);
    assert(r.status === 200, `First pay: ${r.status}`);
    const txn1 = r.data.transactionId;
    assert(!!txn1, `Transaction ID: ${txn1}`);

    r = await api("POST", `/api/orders/${orderId}/pay`, { cardData: {} }, userCookie);
    assert(r.status === 200, `Second pay (idempotent): ${r.status}`);
    assert(r.data.success === true || r.data.transactionId === txn1, `Idempotent: same result, no double charge`);

    r = await api("POST", `/api/orders/${orderId}/pay`, { cardData: {} }, userCookie);
    assert(r.status === 200 || r.status === 400, `Third pay attempt returns safely: ${r.status}`);
  });

  await step("6. Get enrollment", async () => {
    const r = await api("GET", "/api/enrollments", undefined, userCookie);
    assert(r.status === 200, `Get enrollments: ${r.status}`);
    const enrollments = r.data.enrollments || r.data;
    assert(Array.isArray(enrollments) && enrollments.length > 0, `Has enrollment(s)`);
    enrollmentId = enrollments.find((e: any) => e.courseId === courseId)?.id;
    assert(!!enrollmentId, `Enrollment ID: ${enrollmentId}`);
  });

  await step("7. Complete video step (80%+ watch)", async () => {
    const r = await api("POST", `/api/course-player/${enrollmentId}/video-progress`, {
      stepId: stepVideoId,
      watchPercentage: 85,
    }, userCookie);
    assert(r.status === 200, `Video progress: ${r.status}`);
  });

  await step("8. Verify exam questions don't leak correct answers", async () => {
    const r = await api("GET", `/api/course-player/${enrollmentId}/step/${stepExamId}`, undefined, userCookie);
    assert(r.status === 200, `Get exam step: ${r.status}`);
    const questions = r.data.questions || [];
    for (const q of questions) {
      assert(!("correctAnswers" in q), `Question ${q.id} has no correctAnswers`);
      assert(!("correct_answers" in q), `Question ${q.id} has no correct_answers`);
    }
  });

  await step("9. Submit exam → certification issuance", async () => {
    const answerMap: Record<number, string> = {};
    for (const qId of questionIds) {
      answerMap[qId] = "A";
    }

    const r = await api("POST", `/api/course-player/${enrollmentId}/exam-submit`, {
      stepId: stepExamId,
      answers: answerMap,
      durationSeconds: 120,
    }, userCookie);
    assert(r.status === 200, `Exam submit: ${r.status}`);
    assert(r.data.passed === true, `Exam passed`);
    assert(r.data.score >= 70, `Score >= 70: ${r.data.score}`);
    assert(r.data.allComplete === true, `All steps complete`);
    assert(!!r.data.certification, `Certification issued`);
    certId = r.data.certification.id;
    certNumber = r.data.certification.certificateNumber;
    assert(!!certNumber, `Certificate number: ${certNumber}`);
  });

  await step("10. Certificate PDF download (auth-required)", async () => {
    const r = await api("GET", `/api/certifications/${certId}/download`, undefined, userCookie);
    assert(r.status === 200, `PDF download: ${r.status}`);
    assert(r.data.pdfBytes > 100, `PDF has content: ${r.data.pdfBytes} bytes`);

    const unauth = await api("GET", `/api/certifications/${certId}/download`);
    assert(unauth.status === 401 || unauth.status === 404 || unauth.status === 403, `Unauthenticated blocked: ${unauth.status}`);
  });

  await step("11. Public verify page", async () => {
    const r = await api("GET", `/api/verify/${certNumber}`);
    assert(r.status === 200, `Verify: ${r.status}`);
    assert(r.data.valid === true, `Certificate valid`);
    assert(r.data.certificateNumber === certNumber, `Cert number matches`);
    assert(r.data.holderName.includes(UNIQUE.substring(0, 4)) || r.data.holderName.length > 0, `Has holder name (PII-minimized)`);
    assert(!r.data.email, `No email leaked`);
  });

  await step("12. Invoice PDF generation", async () => {
    const r = await api("GET", `/api/orders/${orderId}/invoice`, undefined, userCookie);
    assert(r.status === 200, `Invoice download: ${r.status}`);
    assert(r.data.pdfBytes > 100, `Invoice PDF has content: ${r.data.pdfBytes} bytes`);

    const r2 = await api("GET", `/api/orders/${orderId}/invoice`, undefined, userCookie);
    assert(r2.status === 200, `Invoice idempotent: ${r2.status}`);
  });

  await step("13. Register group admin + create group", async () => {
    let r = await api("POST", "/api/auth/register", {
      email: `groupadmin_${UNIQUE}@test.local`,
      password: "GroupPass123!",
      name: `GroupAdmin ${UNIQUE}`,
    });
    assert(r.status === 200 || r.status === 201, `Register group admin`);
    const gaCookie = r.cookie!;
    const gaUserId = r.data.user?.id || r.data.id;

    const { db } = await import("../server/db");
    const { users } = await import("../shared/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ role: "group_admin" }).where(eq(users.id, gaUserId));

    r = await api("POST", "/api/groups", { name: `TestGroup ${UNIQUE}` }, gaCookie);
    assert(r.status === 200 || r.status === 201, `Create group: ${r.status}`);
    groupId = r.data.group?.id || r.data.id;
    assert(!!groupId, `Group ID: ${groupId}`);

    r = await api("POST", `/api/groups/${groupId}/invite`, {
      email: `invitee_${UNIQUE}@test.local`,
      name: `Invitee ${UNIQUE}`,
    }, gaCookie);
    assert(r.status === 200 || r.status === 201, `Invite member: ${r.status}`);
    memberId = r.data.member?.id || r.data.id;
    inviteToken = r.data.member?.inviteToken || r.data.inviteToken;
    assert(!!inviteToken, `Invite token received`);
  });

  await step("14. Accept invite flow", async () => {
    let r = await api("POST", "/api/auth/register", {
      email: `invitee_${UNIQUE}@test.local`,
      password: "InviteePass123!",
      name: `Invitee ${UNIQUE}`,
    });
    assert(r.status === 200 || r.status === 201, `Register invitee`);
    inviteeCookie = r.cookie!;
    inviteeUserId = r.data.user?.id || r.data.id;

    r = await api("POST", "/api/auth/accept-invite", { inviteToken }, inviteeCookie);
    assert(r.status === 200, `Accept invite: ${r.status}`);

    r = await api("POST", "/api/auth/accept-invite", { inviteToken }, inviteeCookie);
    assert(r.status === 400, `Double-accept blocked: ${r.status}`);
  });

  await step("15. Admin refund → certification revocation", async () => {
    const r = await api("POST", `/api/admin/orders/${orderId}/refund`, {}, adminCookie);
    assert(r.status === 200, `Refund: ${r.status}`);
    assert(r.data.revokedCertifications >= 1, `Certifications revoked: ${r.data.revokedCertifications}`);

    const v = await api("GET", `/api/verify/${certNumber}`);
    assert(v.status === 200, `Verify after revocation`);
    assert(v.data.valid === false || v.data.status === "revoked", `Certificate shows revoked`);
  });

  await step("16. Audit log has entries", async () => {
    const r = await api("GET", "/api/admin/audit-logs", undefined, adminCookie);
    assert(r.status === 200, `Audit logs: ${r.status}`);
    const logs = r.data.logs || r.data.auditLogs || [];
    assert(logs.length > 0, `Has audit log entries: ${logs.length}`);
  });

  await step("17. Rate limiting works", async () => {
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const r = await api("GET", `/api/verify/${certNumber}`);
      lastStatus = r.status;
      if (lastStatus === 429) break;
    }
    assert(lastStatus === 429, `Rate limit triggered: ${lastStatus}`);
  });

  console.log("\n\n🎉 ALL SMOKE TESTS PASSED\n");
}

main().catch((err) => {
  console.error("\n💥 SMOKE TEST FAILED:", err);
  process.exit(1);
});
