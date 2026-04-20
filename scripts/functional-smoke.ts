import { pool } from "../server/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details = "") {
  results.push({ name, passed: condition, details });
  if (!condition) {
    console.error(`  ✗ ${name}${details ? ": " + details : ""}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}

async function fetchRaw(url: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${url}`, init);
  return { status: res.status, headers: res.headers, text: await res.text().catch(() => "") };
}

async function createSessionCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  const setCookies = res.headers.getSetCookie?.() || [];
  let cookieStr = setCookies.join("; ");
  if (!cookieStr) {
    cookieStr = res.headers.get("set-cookie") || "";
  }
  const match = cookieStr.match(/connect\.sid=([^;]+)/);
  return match ? `connect.sid=${match[1]}` : "";
}

async function testSection(name: string, fn: () => Promise<void>) {
  console.log(`\n=== ${name} ===`);
  try {
    await fn();
  } catch (err: any) {
    console.error(`  ✗ SECTION ERROR: ${err.message}`);
    results.push({ name: `${name} (section error)`, passed: false, details: err.message });
  }
}

async function run() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   ForkliftCertified Functional Smoke     ║");
  console.log("╚══════════════════════════════════════════╝\n");

  console.log("Authenticating users (one-time)...");
  const userCookie = await createSessionCookie("user@forkliftcertified.training", "DemoPass!234");
  await new Promise(r => setTimeout(r, 1000));
  const adminCookie = await createSessionCookie("admin@forkliftcertified.training", "DemoPass!234");
  await new Promise(r => setTimeout(r, 1000));
  const groupCookie = await createSessionCookie("group@forkliftcertified.training", "DemoPass!234");
  console.log(`  User cookie: ${userCookie ? "OK" : "FAILED"}`);
  console.log(`  Admin cookie: ${adminCookie ? "OK" : "FAILED"}`);
  console.log(`  Group cookie: ${groupCookie ? "OK" : "FAILED"}`);

  let groupId: number | null = null;
  if (groupCookie) {
    const client = await pool.connect();
    try {
      const groups = await client.query(
        "SELECT g.id FROM groups g JOIN users u ON u.id = g.admin_user_id WHERE u.email = 'group@forkliftcertified.training' ORDER BY g.id DESC LIMIT 1"
      );
      groupId = groups.rows.length > 0 ? groups.rows[0].id : null;
    } finally {
      client.release();
    }
  }

  await testSection("1. Public Pages & SEO", async () => {
    const home = await fetchRaw("/");
    assert("Homepage returns 200", home.status === 200);
    assert("Homepage has title", home.text.includes("ForkliftCertified"));

    const training = await fetchRaw("/training-programs");
    assert("Training programs page returns 200", training.status === 200);

    const docs = await fetchRaw("/documentation");
    assert("Documentation page returns 200", docs.status === 200);
    assert("Documentation page has no Miramar links", !docs.text.includes("training.miramarforklift.com"));

    const contact = await fetchRaw("/contact");
    assert("Contact page returns 200", contact.status === 200);

    const business = await fetchRaw("/business");
    assert("Business page returns 200", business.status === 200);
  });

  await testSection("2. Favicon & Branding Assets", async () => {
    const assets = [
      ["/favicon.ico", "favicon.ico"],
      ["/favicon-16x16.png", "favicon-16x16"],
      ["/favicon-32x32.png", "favicon-32x32"],
      ["/apple-touch-icon.png", "apple-touch-icon"],
      ["/android-chrome-192x192.png", "android-chrome-192"],
      ["/android-chrome-512x512.png", "android-chrome-512"],
      ["/images/forkliftcertified-logo.svg", "Logo SVG"],
      ["/images/forkliftcertified-navbar-44h.png", "Navbar logo"],
    ];
    for (const [path, name] of assets) {
      const res = await fetchRaw(path);
      assert(`${name} returns 200`, res.status === 200);
    }
  });

  await testSection("3. Document Downloads", async () => {
    const docIds = [
      "osha-rules-regulations",
      "sample-test",
      "pre-operation-checklist",
      "performance-evaluation",
      "operator-permit",
      "attendance-sheet",
    ];
    for (const docId of docIds) {
      const res = await fetchRaw(`/api/documents/${docId}/download`);
      assert(`Document ${docId} returns 200`, res.status === 200);
      const ct = res.headers.get("content-type") || "";
      assert(`Document ${docId} is PDF`, ct.includes("application/pdf"));
    }
  });

  await testSection("4. Auth Flow", async () => {
    const me = await fetchJson("/api/auth/me");
    assert("Unauthenticated /api/auth/me returns user:null", me.body?.user === null);

    assert("User login returned session cookie", userCookie.length > 0);

    if (userCookie) {
      const authed = await fetchJson("/api/auth/me", { headers: { Cookie: userCookie, "Content-Type": "application/json" } });
      assert("Authenticated /api/auth/me returns user", authed.body?.user?.email === "user@forkliftcertified.training");
    }

    assert("Admin login returned session cookie", adminCookie.length > 0);

    if (adminCookie) {
      const adminMe = await fetchJson("/api/auth/me", { headers: { Cookie: adminCookie, "Content-Type": "application/json" } });
      assert("Admin user has super_admin role", adminMe.body?.user?.role === "super_admin");
    }
  });

  await testSection("5. Individual Checkout Flow (DEMO_MODE)", async () => {
    if (!userCookie) {
      assert("SKIP: No session cookie", false, "Cannot test checkout without auth");
      return;
    }

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { Cookie: userCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ courseSlug: "online-forklift-operator-certification", quantity: 1 }],
        refundPolicyAccepted: true,
        isTeamPurchase: false,
      }),
    });
    const orderBody = await orderRes.json().catch(() => null);
    assert("Create individual order returns 201 or 200", [200, 201].includes(orderRes.status), `Status: ${orderRes.status}`);
    assert("Order has id", !!orderBody?.order?.id, `Order: ${JSON.stringify(orderBody?.order?.id)}`);

    if (orderBody?.order?.id) {
      const payRes = await fetch(`${BASE_URL}/api/orders/${orderBody.order.id}/pay`, {
        method: "POST",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          cardData: { cardNumber: "4111111111111111", expirationDate: "12/28", cardCode: "123" },
        }),
      });
      assert("Pay order returns 200", payRes.status === 200, `Status: ${payRes.status}`);

      const client = await pool.connect();
      try {
        const enrollments = await client.query(
          "SELECT id, user_id, course_id FROM enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'user@forkliftcertified.training') ORDER BY id DESC LIMIT 1"
        );
        assert("Enrollment created for individual order", enrollments.rows.length > 0,
          `Found ${enrollments.rows.length} enrollments`);
      } finally {
        client.release();
      }
    }
  });

  await testSection("6. Group Purchase Flow", async () => {
    const client = await pool.connect();
    try {
      const courses = await client.query("SELECT id, slug FROM courses WHERE slug = 'online-forklift-operator-certification' AND is_active = true");
      assert("Team course exists in DB", courses.rows.length > 0);

      const groups = await client.query(
        "SELECT g.id, g.name, g.admin_user_id, u.role FROM groups g JOIN users u ON u.id = g.admin_user_id WHERE u.email = 'group@forkliftcertified.training'"
      );
      assert("Group admin has a group", groups.rows.length > 0, `Found ${groups.rows.length} groups`);

      if (groups.rows.length > 0) {
        const groupId = groups.rows[0].id;
        const groupOrders = await client.query(
          "SELECT id, group_id, status FROM orders WHERE group_id = $1",
          [groupId]
        );
        assert("Group has orders linked", groupOrders.rows.length > 0, `Found ${groupOrders.rows.length} orders`);

        const seats = await client.query(
          "SELECT e.id, e.user_id, e.status FROM enrollments e JOIN orders o ON e.order_id = o.id WHERE o.group_id = $1",
          [groupId]
        );
        assert("Group has enrollment seats", seats.rows.length > 0, `Found ${seats.rows.length} seats`);
      }
    } finally {
      client.release();
    }
  });

  await testSection("7. Certificate & Download", async () => {
    const client = await pool.connect();
    try {
      const certs = await client.query(
        "SELECT c.id, c.user_id, c.verification_token, c.pdf_url FROM certifications c LIMIT 1"
      );

      if (certs.rows.length > 0) {
        const cert = certs.rows[0];
        assert("Certificate exists in DB", true);
        assert("Certificate has verification token", !!cert.verification_token);

        if (cert.verification_token) {
          const verifyRes = await fetchJson(`/api/certifications/verify/${cert.verification_token}`);
          assert("Verification endpoint returns 200", verifyRes.status === 200);
        }
      } else {
        assert("No certificates in DB yet (OK for smoke)", true, "Will exist after course completion");
      }
    } finally {
      client.release();
    }
  });

  await testSection("8. Email Outbox", async () => {
    const client = await pool.connect();
    try {
      const emails = await client.query('SELECT id, template, "to", subject, provider_status FROM email_outbox ORDER BY id DESC LIMIT 5');
      assert("Email outbox has records", emails.rows.length > 0, `Found ${emails.rows.length} emails`);

      if (emails.rows.length > 0) {
        const templates = emails.rows.map((r: any) => r.template);
        assert("Email records have templates", templates.every((t: any) => t && t.length > 0));
      }
    } finally {
      client.release();
    }
  });

  await testSection("9. Admin API Access", async () => {
    if (!adminCookie) {
      assert("SKIP: No admin cookie", false);
      return;
    }

    const users = await fetchJson("/api/admin/users", { headers: { Cookie: adminCookie, "Content-Type": "application/json" } });
    assert("Admin can list users", users.status === 200);

    const orders = await fetchJson("/api/admin/orders", { headers: { Cookie: adminCookie, "Content-Type": "application/json" } });
    assert("Admin can list orders", orders.status === 200);

    const auditLogs = await fetchJson("/api/admin/audit-logs", { headers: { Cookie: adminCookie, "Content-Type": "application/json" } });
    assert("Admin can list audit logs", auditLogs.status === 200);

    const emailOutbox = await fetchJson("/api/admin/email-outbox", { headers: { Cookie: adminCookie, "Content-Type": "application/json" } });
    assert("Admin can list email outbox", emailOutbox.status === 200);
  });

  await testSection("10. SSR & SEO", async () => {
    const ssrPage = await fetchRaw("/online-forklift-certification");
    assert("SSR page returns 200", ssrPage.status === 200);
    assert("SSR page has X-SSR header", ssrPage.headers.get("x-ssr") === "true");
    assert("SSR page has title tag", ssrPage.text.includes("<title>"));
    assert("SSR page has meta description", ssrPage.text.includes('name="description"'));
    assert("SSR page includes favicon link", ssrPage.text.includes('favicon'));
    assert("SSR page has no Miramar references", !ssrPage.text.includes("miramarforklift.com"));

    const sitemap = await fetchRaw("/sitemap.xml");
    assert("Sitemap returns 200", sitemap.status === 200);
    assert("Sitemap is XML", (sitemap.headers.get("content-type") || "").includes("xml"));

    const robots = await fetchRaw("/robots.txt");
    assert("robots.txt returns 200", robots.status === 200);
  });

  await testSection("11. No Miramar References in Source", async () => {
    const pages = ["/", "/training-programs", "/documentation", "/business", "/contact"];
    for (const page of pages) {
      const res = await fetchRaw(page);
      assert(`${page} has no miramarforklift.com link`, !res.text.includes("training.miramarforklift.com"));
    }
  });

  await testSection("12. Group Admin Features (T001-T012)", async () => {
    assert("Group admin login returned session cookie", !!groupCookie && groupCookie.length > 0);

    if (!groupCookie || !groupId) return;

    const client = await pool.connect();
    try {

      // T004: Invite-info endpoint (public, no auth needed)
      const inviteInfoNoToken = await fetchJson("/api/auth/invite-info?token=invalid-token-xyz");
      assert("invite-info with invalid token returns 404", inviteInfoNoToken.status === 404);

      // T003: Duplicate invite prevention - invite a fresh email then try again
      const testEmail = `smoke-dup-${Date.now()}@test.com`;
      const invite1 = await fetch(`${BASE_URL}/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { Cookie: groupCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, name: "Smoke Test" }),
      });
      const invite1Body = await invite1.json().catch(() => null);
      assert("First invite returns 200/201", [200, 201].includes(invite1.status), `Status: ${invite1.status}`);

      const invite2 = await fetch(`${BASE_URL}/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { Cookie: groupCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, name: "Smoke Test" }),
      });
      const invite2Body = await invite2.json().catch(() => null);
      assert("Duplicate invite returns 400", invite2.status === 400, `Status: ${invite2.status}`);

      // T004: invite-info with valid token
      if (invite1Body?.inviteToken) {
        const inviteInfo = await fetchJson(`/api/auth/invite-info?token=${invite1Body.inviteToken}`);
        assert("invite-info with valid token returns 200", inviteInfo.status === 200);
        assert("invite-info returns email", inviteInfo.body?.email === testEmail);
      }

      // T008: Unassign seat API
      const enrollments = await client.query(
        "SELECT e.id, e.user_id FROM enrollments e JOIN orders o ON e.order_id = o.id WHERE o.group_id = $1 AND e.user_id IS NOT NULL LIMIT 1",
        [groupId]
      );
      if (enrollments.rows.length > 0) {
        const unassignRes = await fetch(`${BASE_URL}/api/groups/${groupId}/unassign-seat`, {
          method: "POST",
          headers: { Cookie: groupCookie, "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentId: enrollments.rows[0].id }),
        });
        // May succeed or fail depending on progress - just check it doesn't 500
        assert("Unassign seat API doesn't crash", unassignRes.status !== 500, `Status: ${unassignRes.status}`);
      } else {
        assert("No assigned seats to test unassign (OK)", true);
      }

      // T010: Members endpoint returns enriched data
      const membersRes = await fetchJson(`/api/groups/${groupId}/members`, {
        headers: { Cookie: groupCookie, "Content-Type": "application/json" },
      });
      assert("Members endpoint returns 200", membersRes.status === 200);
      assert("Members endpoint returns members array", Array.isArray(membersRes.body?.members));

      // T012: Remind endpoint rate limiting
      const members = await client.query(
        "SELECT id FROM group_members WHERE group_id = $1 AND accepted_at IS NOT NULL LIMIT 1",
        [groupId]
      );
      if (members.rows.length > 0) {
        const remindRes = await fetch(`${BASE_URL}/api/groups/${groupId}/members/${members.rows[0].id}/remind`, {
          method: "POST",
          headers: { Cookie: groupCookie, "Content-Type": "application/json" },
        });
        // May succeed (200) or rate limit (429) - shouldn't crash
        assert("Remind endpoint doesn't crash", [200, 429].includes(remindRes.status), `Status: ${remindRes.status}`);
      }

      // Cleanup test invite
      await client.query("DELETE FROM group_members WHERE email = $1", [testEmail]);
    } finally {
      client.release();
    }
  });

  await testSection("13. Enriched Enrollments API", async () => {
    if (userCookie) {
      const { status, body } = await fetchJson("/api/enrollments", {
        headers: { Cookie: userCookie },
      });
      assert("Enrollments returns 200", status === 200);
      if (body?.enrollments?.length > 0) {
        const first = body.enrollments[0];
        assert("Enrollment has course object", !!first.course && typeof first.course.title === "string", `course: ${JSON.stringify(first.course)}`);
        assert("Enrollment has progress object", !!first.progress && typeof first.progress.percentage === "number", `progress: ${JSON.stringify(first.progress)}`);
        assert("Progress has completedSteps", typeof first.progress?.completedSteps === "number");
        assert("Progress has totalSteps", typeof first.progress?.totalSteps === "number");
        assert("Progress has estimatedMinutesRemaining", typeof first.progress?.estimatedMinutesRemaining === "number");
        assert("Enrollment has certificationId field", first.hasOwnProperty("certificationId"));
      } else {
        assert("No enrollments for user (OK)", true);
      }
    } else {
      assert("No user cookie for enrollment test (OK)", true);
    }
  });

  await testSection("14. Seat Pre-Assignment Collision Check", async () => {
    if (groupCookie && groupId) {
      const client = await pool.connect();
      try {
        const enrollments = await client.query(
          "SELECT id FROM enrollments WHERE order_id IN (SELECT id FROM orders WHERE group_id = $1) AND user_id IS NULL LIMIT 1",
          [groupId]
        );
        if (enrollments.rows.length > 0) {
          const enrollmentId = enrollments.rows[0].id;
          const testEmail1 = `collision-test-1-${Date.now()}@test.local`;
          const testEmail2 = `collision-test-2-${Date.now()}@test.local`;

          const invite1 = await fetchJson(`/api/groups/${groupId}/invite`, {
            method: "POST",
            headers: { Cookie: groupCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail1, name: "Test 1", enrollmentId }),
          });
          assert("First invite with seat succeeds", invite1.status === 201);

          const invite2 = await fetchJson(`/api/groups/${groupId}/invite`, {
            method: "POST",
            headers: { Cookie: groupCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail2, name: "Test 2", enrollmentId }),
          });
          assert("Duplicate seat pre-assignment blocked", invite2.status === 400, `Status: ${invite2.status}, body: ${JSON.stringify(invite2.body)}`);

          await client.query("DELETE FROM group_members WHERE email IN ($1, $2)", [testEmail1, testEmail2]);
        } else {
          assert("No unassigned enrollments for collision test (OK)", true);
        }
      } finally {
        client.release();
      }
    } else {
      assert("No group cookie for collision test (OK)", true);
    }
  });

  await testSection("15. Invoice PDF", async () => {
    const client = await pool.connect();
    try {
      const orders = await client.query("SELECT id FROM orders WHERE status = 'paid' LIMIT 1");
      if (orders.rows.length > 0 && adminCookie) {
        const invoiceRes = await fetchRaw(`/api/orders/${orders.rows[0].id}/invoice`, {
          headers: { Cookie: adminCookie },
        });
        assert("Invoice PDF returns 200", invoiceRes.status === 200);
      } else {
        assert("No paid orders for invoice test (OK)", true);
      }
    } finally {
      client.release();
    }
  });

  await testSection("16. Duplicate Prevention (DB Constraints)", async () => {
    const client = await pool.connect();
    try {
      const idxRes = await client.query(
        `SELECT indexname FROM pg_indexes WHERE indexname IN (
          'group_members_group_email_idx',
          'course_steps_course_order_idx',
          'order_items_order_course_idx',
          'enrollments_user_course_active_idx',
          'step_progress_enrollment_step_idx'
        )`
      );
      const existingIndexes = idxRes.rows.map((r: any) => r.indexname);
      assert("Unique index: group_members (groupId, email)", existingIndexes.includes("group_members_group_email_idx"));
      assert("Unique index: course_steps (courseId, stepOrder)", existingIndexes.includes("course_steps_course_order_idx"));
      assert("Unique index: order_items (orderId, courseId)", existingIndexes.includes("order_items_order_course_idx"));
      assert("Unique index: enrollments (userId, courseId) active", existingIndexes.includes("enrollments_user_course_active_idx"));
      assert("Unique index: step_progress (enrollmentId, stepId)", existingIndexes.includes("step_progress_enrollment_step_idx"));

      const dupeEnrollments = await client.query(
        `SELECT user_id, course_id, COUNT(*) as cnt FROM enrollments
         WHERE status != 'revoked' AND user_id IS NOT NULL
         GROUP BY user_id, course_id HAVING COUNT(*) > 1`
      );
      assert("No duplicate active enrollments exist", dupeEnrollments.rows.length === 0,
        dupeEnrollments.rows.length > 0 ? `Found ${dupeEnrollments.rows.length} duplicates` : "");

      const dupeProgress = await client.query(
        `SELECT enrollment_id, step_id, COUNT(*) as cnt FROM step_progress
         GROUP BY enrollment_id, step_id HAVING COUNT(*) > 1`
      );
      assert("No duplicate step_progress rows exist", dupeProgress.rows.length === 0,
        dupeProgress.rows.length > 0 ? `Found ${dupeProgress.rows.length} duplicates` : "");
    } finally {
      client.release();
    }
  });

  await testSection("17. Cert Card Duplicate Prevention", async () => {
    if (!userCookie) { assert("Need user cookie for card order test", false); return; }
    const certRes = await fetchJson("/api/certifications", { headers: { Cookie: userCookie } });
    if (certRes.status !== 200 || !certRes.body?.certifications?.length) {
      assert("No certifications for card order dupe test (OK)", true);
      return;
    }
    const certId = certRes.body.certifications[0].id;
    const cardPayload = {
      certificationId: certId,
      shippingAddress: { name: "Test", street: "123 Test St", city: "TestCity", state: "TS", zip: "12345" },
      shippingMethod: "standard",
    };
    const first = await fetchJson("/api/cert-cards", {
      method: "POST",
      headers: { Cookie: userCookie, "Content-Type": "application/json" },
      body: JSON.stringify(cardPayload),
    });
    if (first.status === 201) {
      const second = await fetchJson("/api/cert-cards", {
        method: "POST",
        headers: { Cookie: userCookie, "Content-Type": "application/json" },
        body: JSON.stringify(cardPayload),
      });
      assert("Duplicate cert card order returns 409", second.status === 409);
    } else if (first.status === 409) {
      assert("Cert card order blocked (existing active order)", true);
    } else {
      assert("Cert card order attempt returned expected status", first.status === 201 || first.status === 409,
        `Got status ${first.status}: ${JSON.stringify(first.body)}`);
    }
  });

  console.log("\n╔══════════════════════════════════════════╗");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  console.log(`║  Results: ${passed}/${total} passed, ${failed} failed`);
  console.log("╚══════════════════════════════════════════╝");

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ✗ ${r.name}${r.details ? ": " + r.details : ""}`);
    });
  }

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
