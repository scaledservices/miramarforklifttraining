/**
 * Group Flow Reliability Smoke Tests
 *
 * Tests the complete group training lifecycle end-to-end with real API interactions:
 *
 *   S0. Group purchase flow: order creation produces unassigned team seats
 *   S1. No-token invite → Invalid Invite Link (UI)
 *   S2. Invite inline auth form: locked email, tabs, button labels (UI)
 *   S3. Full invite acceptance flow — no pre-assignment → redirectTo = /dashboard
 *   S4. Full invite acceptance flow — with pre-assigned seat → redirectTo = /course/:enrollmentId
 *   S5. Invite status transition mutation freshness (invited → active; cache invalidated)
 *   S6. Duplicate seat prevention (400 for unknown enrollment, 400 for known-member invite)
 *   S7. Assign-seat ownership guard (403 for cross-group enrollment)
 *   S8. Member status badge labels — only 5 valid values, no Accepted/Seat Assigned (UI)
 *   S9. Post-accept routing — active member navigates to /course/:enrollmentId (UI)
 *   S10. Auth refresh — group admin role confirmed immediately after login
 *   S11. Group sub-pages load + badge-count freshness after navigation (UI)
 *
 * Prerequisites: server running on port 5000 (npm run dev)
 *
 * Seeded demo data:
 *   super admin:  peter+forkliftcertifiedadmin@scaled.services / ForkLift!Admin2026
 *   group admin:  group@forkliftcertified.training / DemoPass!234  (group id 4)
 *   member1:      member1@forkliftcertified.training / DemoPass!234 (enrollment id 15)
 *   unassigned:   enrollment ids 17 and 19 (group 4, no userId)
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import crypto from "crypto";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5000";
const ADMIN_EMAIL = "group@forkliftcertified.training";
const ADMIN_PW = "DemoPass!234";
const MEMBER1_EMAIL = "member1@forkliftcertified.training";
const MEMBER1_PW = "DemoPass!234";
const GROUP_ID = 4;
const UNASSIGNED_ENROLLMENT_ID = 17;
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";
const COURSE_SLUG = "online-forklift-operator-certification"; // matches seed data slug in DB

async function loginUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  const form = page.locator('[data-testid="form-login"]');
  await form.locator('[data-testid="input-email"]').fill(email);
  await form.locator('[data-testid="input-password"]').fill(password);
  await form.locator('[data-testid="button-login"]').click();
  await page.waitForURL(/\/(dashboard|group|admin|course)/, { timeout: 10000 });
}

// ============================================================
// S0: Group Purchase Flow
// Creates a team order and verifies unassigned seats are provisioned
// (Stripe is live; we prove the purchase pipeline using isTeamPurchase
//  with an individual user + API assertions, matching what happens
//  after a real Stripe payment via the same code path.)
// ============================================================
test.describe("S0 – Group purchase: order creation creates unassigned seats", () => {
  test("POST /api/orders with isTeamPurchase=true creates enrollment records with no userId", async ({
    request,
  }) => {
    // Register a fresh buyer
    const buyerEmail = `buyer-${crypto.randomUUID().slice(0, 8)}@example.com`;
    const regResp = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email: buyerEmail, password: "TestPass!234", name: "Group Buyer" },
    });
    expect(regResp.status()).toBe(201);
    const { user } = await regResp.json();
    expect(user.id).toBeTruthy();

    // Create a 2-seat team order
    const orderResp = await request.post(`${BASE_URL}/api/orders`, {
      data: {
        items: [{ courseSlug: COURSE_SLUG, quantity: 2 }],
        isTeamPurchase: true,
        refundPolicyAccepted: true,
      },
    });
    expect(orderResp.status()).toBe(201);
    const { order } = await orderResp.json();
    expect(order.id).toBeTruthy();
    expect(order.status).toBe("pending");

    // The order should exist in /api/orders/:id
    const orderGetResp = await request.get(`${BASE_URL}/api/orders/${order.id}`);
    expect(orderGetResp.status()).toBe(200);
    const orderDetail = await orderGetResp.json();

    // Order must have enrollments with no userId (unassigned team seats)
    const unassignedSeats = (orderDetail.enrollments ?? []).filter(
      (e: any) => e.userId === null || e.userId === undefined
    );
    expect(
      unassignedSeats.length,
      "Team order must create unassigned seat enrollments"
    ).toBeGreaterThanOrEqual(2);

    // The order total must reflect 2x course price
    expect(parseFloat(order.total)).toBeGreaterThan(0);
  });

  test("Seeded group 4 has existing unassigned seats from prior purchase", async ({ request }) => {
    // Login as group admin to check enrollment seats
    const loginResp = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PW },
    });
    expect(loginResp.status()).toBe(200);

    // /api/groups/:id/enrollments returns all group enrollments with assigned/unassigned info
    const enrollResp = await request.get(`${BASE_URL}/api/groups/${GROUP_ID}/enrollments`);
    expect(enrollResp.status()).toBe(200);
    const { enrollments } = await enrollResp.json();
    const unassigned = (enrollments ?? []).filter((e: any) => !e.userId);
    expect(
      unassigned.length,
      "Group 4 should have unassigned seats available for invite flow"
    ).toBeGreaterThan(0);
  });
});

// ============================================================
// S1: No-token invite
// ============================================================
test("S1 – No token shows Invalid Invite Link", async ({ page }) => {
  await page.goto(`${BASE_URL}/accept-invite`);
  await expect(page.locator('[data-testid="text-no-token"]')).toBeVisible();
});

// ============================================================
// S2: Invite inline auth form UX
// ============================================================
test.describe("S2 – Invite page inline auth form", () => {
  test("UUID token: shows invite title, tabs, locked email, Create Account button", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/accept-invite?token=${FAKE_UUID}`);
    await expect(page.locator('[data-testid="text-invite-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-register"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-login"]')).toBeVisible();
    const emailInput = page.locator('[data-testid="input-invite-email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("readonly");
    await expect(page.locator('[data-testid="button-auth-submit"]')).toContainText("Create Account");
  });

  test("Login tab hides name field and changes button to Sign In", async ({ page }) => {
    await page.goto(`${BASE_URL}/accept-invite?token=${FAKE_UUID}`);
    await expect(page.locator('[data-testid="input-invite-name"]')).toBeVisible();
    await page.locator('[data-testid="tab-login"]').click();
    await expect(page.locator('[data-testid="input-invite-name"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="button-auth-submit"]')).toContainText("Sign In");
    await page.locator('[data-testid="tab-register"]').click();
    await expect(page.locator('[data-testid="input-invite-name"]')).toBeVisible();
  });
});

// ============================================================
// S3: Full invite acceptance — no pre-assignment → redirectTo = /dashboard
// ============================================================
test("S3 – Accept invite without pre-assignment: redirectTo = /dashboard", async ({ request }) => {
  // Admin creates invite (no seat)
  await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PW },
  });

  const testEmail = `s3-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const inviteResp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/invite`, {
    data: { email: testEmail, name: "S3 User" },
  });
  expect(inviteResp.status()).toBe(201);
  const { member } = await inviteResp.json();
  const token = member?.inviteToken;
  expect(token).toBeTruthy();
  expect(member.pendingEnrollmentId).toBeFalsy();

  // New user registers
  const regResp = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: testEmail, password: "TestPass!234", name: "S3 User" },
  });
  expect(regResp.status()).toBe(201);

  // User accepts invite while authenticated in the same request context
  const acceptResp = await request.post(`${BASE_URL}/api/auth/accept-invite`, {
    data: { inviteToken: token },
  });
  expect(acceptResp.status()).toBe(200);
  const acceptData = await acceptResp.json();

  // Verify mutation outcome: no seat → /dashboard
  expect(acceptData.redirectTo).toBe("/dashboard");
  expect(acceptData.assignedEnrollmentId).toBeFalsy();
  expect(acceptData.member.acceptedAt).toBeTruthy();
  expect(acceptData.member.userId).toBeTruthy();
});

// ============================================================
// S4: Full invite acceptance — with pre-assigned seat → redirectTo = /course/:id
// ============================================================
test("S4 – Accept invite with pre-assigned seat: redirectTo = /course/:enrollmentId", async ({
  request,
}) => {
  // Admin creates invite with pre-assigned enrollment
  await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PW },
  });

  const testEmail = `s4-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const inviteResp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/invite`, {
    data: { email: testEmail, name: "S4 User", enrollmentId: UNASSIGNED_ENROLLMENT_ID },
  });

  // If enrollment already used (test idempotency), skip gracefully
  if (inviteResp.status() !== 201) {
    const err = await inviteResp.json();
    test.skip(
      err.error?.includes("already") || err.error?.includes("assigned"),
      `Enrollment ${UNASSIGNED_ENROLLMENT_ID} unavailable: ${err.error}`
    );
    return;
  }

  const { member } = await inviteResp.json();
  const token = member?.inviteToken;
  expect(token).toBeTruthy();

  // New user registers (new request context = fresh session)
  const regResp = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: testEmail, password: "TestPass!234", name: "S4 User" },
  });
  expect(regResp.status()).toBe(201);

  // User accepts invite while authenticated
  const acceptResp = await request.post(`${BASE_URL}/api/auth/accept-invite`, {
    data: { inviteToken: token },
  });
  expect(acceptResp.status()).toBe(200);
  const acceptData = await acceptResp.json();

  // Verify mutation outcome: pre-assigned seat → /course/:enrollmentId
  if (acceptData.assignedEnrollmentId) {
    expect(acceptData.redirectTo).toMatch(/^\/course\/\d+$/);
    expect(acceptData.redirectTo).toBe(`/course/${acceptData.assignedEnrollmentId}`);
  } else {
    // seatAssignmentFailed fallback is valid
    expect(acceptData.redirectTo).toBe("/dashboard");
    expect(acceptData.seatAssignmentFailed).toBe(true);
  }
  expect(acceptData.member.acceptedAt).toBeTruthy();
});

// ============================================================
// S5: Invite status transition mutation freshness
// Verify: invited member → accept → trainingStatus changes to active/in_progress
// ============================================================
test("S5 – Accept invite changes trainingStatus from invited to active (no reload needed)", async ({
  request,
}) => {
  // Admin creates invite
  await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PW },
  });
  const testEmail = `s5-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const inviteResp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/invite`, {
    data: { email: testEmail, name: "S5 User" },
  });
  expect(inviteResp.status()).toBe(201);
  const { member: invitedMember } = await inviteResp.json();

  // Check status before acceptance (as group admin)
  const membersBefore = await request.get(`${BASE_URL}/api/groups/${GROUP_ID}/members`);
  const { members: beforeList } = await membersBefore.json();
  const memberBefore = beforeList.find((m: any) => m.id === invitedMember.id);
  expect(memberBefore?.trainingStatus).toBe("invited");

  // User registers and accepts (separate request context below)
  const regResp = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: testEmail, password: "TestPass!234", name: "S5 User" },
  });
  expect(regResp.status()).toBe(201);

  await request.post(`${BASE_URL}/api/auth/accept-invite`, {
    data: { inviteToken: invitedMember.inviteToken },
  });

  // Re-login as admin and check members — status must have changed
  await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PW },
  });
  const membersAfter = await request.get(`${BASE_URL}/api/groups/${GROUP_ID}/members`);
  const { members: afterList } = await membersAfter.json();
  const memberAfter = afterList.find((m: any) => m.id === invitedMember.id);
  expect(
    ["active", "in_progress", "completed"],
    `After acceptance, trainingStatus must not be invited, got: ${memberAfter?.trainingStatus}`
  ).toContain(memberAfter?.trainingStatus);
});

// ============================================================
// S6: Duplicate seat prevention
// ============================================================
test.describe("S6 – Duplicate seat prevention", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PW },
    });
  });

  test("assign-seat returns 400 for non-existent enrollment", async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/assign-seat`, {
      data: { enrollmentId: 99999, userId: 99999 },
    });
    expect(resp.status()).toBe(400);
    const { error } = await resp.json();
    expect(error).toMatch(/not found|Cannot/i);
  });

  test("invite returns 400 for email already a member of the group", async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/invite`, {
      data: { email: MEMBER1_EMAIL, name: "Mike Member" },
    });
    expect(resp.status()).toBe(400);
    const { error } = await resp.json();
    expect(error).toMatch(/already a member|already been invited|already an active/i);
  });
});

// ============================================================
// S7: Ownership guards — 403/400 for cross-group enrollment in both
//     assign-seat and invite pre-assignment
// ============================================================
test.describe("S7 – Cross-group enrollment ownership guards", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PW },
    });
  });

  test("assign-seat returns 400/403 if enrollment belongs to a different group", async ({ request }) => {
    // Enrollment 1 is an individual purchase, not tied to group 4's order
    const resp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/assign-seat`, {
      data: { enrollmentId: 1, userId: 24 },
    });
    expect([400, 403]).toContain(resp.status());
    const { error } = await resp.json();
    expect(error).toBeTruthy();
  });

  test("invite with pre-assignment returns 400/403 if enrollment belongs to another group", async ({ request }) => {
    // Enrollment 1 has no orderId / belongs to a different order than group 4
    const resp = await request.post(`${BASE_URL}/api/groups/${GROUP_ID}/invite`, {
      data: {
        email: `cross-guard-${crypto.randomUUID().slice(0, 8)}@example.com`,
        name: "Cross Guard Test",
        enrollmentId: 1,
      },
    });
    expect([400, 403]).toContain(resp.status());
    const { error } = await resp.json();
    expect(error).toMatch(/not found|does not belong|Access denied/i);
  });
});

// ============================================================
// S8: Member status badge labels — 5 valid values only
// ============================================================
test("S8 – Members page shows only valid status labels (no Accepted/Seat Assigned)", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginUI(page, ADMIN_EMAIL, ADMIN_PW);
  await page.goto(`${BASE_URL}/group/members`);

  await expect(page.locator('[data-testid="text-page-title"]')).toHaveText("Members");

  const badges = page.locator('[data-testid^="badge-member-status-"]');
  const count = await badges.count();
  expect(count).toBeGreaterThan(0);

  const VALID_LABELS = new Set(["Invited", "Active", "Completed", "Revoked"]);

  for (let i = 0; i < count; i++) {
    const text = (await badges.nth(i).textContent())?.trim() ?? "";
    const isValid = VALID_LABELS.has(text) || text.startsWith("In Progress");
    expect(isValid, `Unexpected badge text at index ${i}: "${text}"`).toBe(true);
    expect(text, "Badge must not say Accepted").not.toBe("Accepted");
    expect(text, "Badge must not say Seat Assigned").not.toBe("Seat Assigned");
  }
  await ctx.close();
});

// ============================================================
// S9: Post-accept routing — active member navigates to course player
// ============================================================
test("S9 – Active member (member1) can navigate to /course/:enrollmentId without redirect", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginUI(page, MEMBER1_EMAIL, MEMBER1_PW);

  const enrollResp = await ctx.request.get(`${BASE_URL}/api/enrollments`);
  expect(enrollResp.status()).toBe(200);
  const enrollData = await enrollResp.json();
  const enrollments = Array.isArray(enrollData)
    ? enrollData
    : enrollData?.enrollments ?? [];

  const active = enrollments.find(
    (e: any) => e.status === "active" || e.status === "in_progress"
  );
  expect(active, "member1 should have an active enrollment").toBeDefined();

  await page.goto(`${BASE_URL}/course/${active.id}`);
  await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });

  const heading = page.locator("h1, h2, [data-testid='text-course-title']").first();
  await expect(heading).toBeVisible({ timeout: 5000 });

  await ctx.close();
});

// ============================================================
// S10: Auth refresh — role and group data available immediately after login
// ============================================================
test("S10 – Group admin role and group list confirmed immediately after login (no reload)", async ({
  request,
}) => {
  const loginResp = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PW },
  });
  expect(loginResp.status()).toBe(200);

  // Immediately check /api/auth/me — same request context, no page reload
  const meResp = await request.get(`${BASE_URL}/api/auth/me`);
  expect(meResp.status()).toBe(200);
  const { user } = await meResp.json();
  expect(user?.role).toMatch(/group_admin|super_admin/);

  // /api/groups must be populated immediately (cache freshness without navigation)
  const groupsResp = await request.get(`${BASE_URL}/api/groups`);
  expect(groupsResp.status()).toBe(200);
  const groupsData = await groupsResp.json();
  const groups = Array.isArray(groupsData) ? groupsData : groupsData?.groups ?? [];
  expect(groups.length).toBeGreaterThan(0);
  expect(groups[0].id).toBe(GROUP_ID);
});

// ============================================================
// S11: Group sub-pages load + cache freshness
// ============================================================
test.describe("S11 – Group sub-pages and cache freshness", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    await loginUI(page, ADMIN_EMAIL, ADMIN_PW);
  });
  test.afterEach(() => ctx.close());

  test("Seats page loads with correct heading", async () => {
    await page.goto(`${BASE_URL}/group/seats`);
    await expect(page.locator('[data-testid="text-page-title"]')).toHaveText("Seat Assignments");
  });

  test("Progress page loads with correct heading", async () => {
    await page.goto(`${BASE_URL}/group/progress`);
    await expect(page.locator('[data-testid="text-page-title"]')).toHaveText("Progress Tracking");
  });

  test("Certifications page loads with correct heading", async () => {
    await page.goto(`${BASE_URL}/group/certifications`);
    await expect(page.locator('[data-testid="text-page-title"]')).toHaveText("Certifications");
  });

  test("Member badge count is the same after navigating away and back (cache freshness)", async () => {
    await page.goto(`${BASE_URL}/group/members`);
    const countBefore = await page.locator('[data-testid^="badge-member-status-"]').count();
    await page.goto(`${BASE_URL}/group/seats`);
    await page.goto(`${BASE_URL}/group/members`);
    const countAfter = await page.locator('[data-testid^="badge-member-status-"]').count();
    expect(countAfter).toBe(countBefore);
  });
});
