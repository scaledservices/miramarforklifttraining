// Comprehensive staging E2E gate — API-level, no browser.
const BASE = "https://exquisite-perception-staging-725a.up.railway.app";
const results = [];
function ok(name, cond, detail = "") {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// Minimal cookie jar per user
function jar() {
  const cookies = {};
  return {
    async fetch(path, opts = {}) {
      const headers = { ...(opts.headers || {}) };
      const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
      if (cookieStr) headers["Cookie"] = cookieStr;
      if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
      if (opts.method && opts.method !== "GET") headers["Origin"] = BASE;
      const res = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
      const setC = res.headers.getSetCookie?.() || [];
      for (const c of setC) {
        const [kv] = c.split(";");
        const i = kv.indexOf("=");
        cookies[kv.slice(0, i)] = kv.slice(i + 1);
      }
      return res;
    },
  };
}

async function tokenizeCard(payConf, id) {
  const res = await fetch("https://apitest.authorize.net/xml/v1/request.api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      securePaymentContainerRequest: {
        merchantAuthentication: { name: payConf.apiLoginID, clientKey: payConf.clientKey },
        data: { type: "TOKEN", id, token: { cardNumber: "4007000000027", expirationDate: "122028", cardCode: "123", zip: "92101" } },
      },
    }),
  });
  const text = await res.text();
  const j = JSON.parse(text.replace(/^﻿/, ""));
  if (j.messages?.resultCode !== "Ok") throw new Error("tokenize failed: " + JSON.stringify(j.messages));
  return j.opaqueData.dataValue;
}

const stamp = Date.now().toString(36);

// ─── 1. Homepage + bundle i18n sentinels ───
{
  const res = await fetch(BASE + "/");
  const html = await res.text();
  ok("1a homepage 200 + title", res.status === 200 && /<title>/.test(html));
  const asset = (html.match(/src="(\/assets\/index-[^"]+\.js)"/) || [])[1];
  ok("1b main bundle referenced", !!asset, asset || "no asset found");
  if (asset) {
    const js = await (await fetch(BASE + asset)).text();
    ok("1c bundle has TrustBadgeBar copy", js.includes("OSHA 29 CFR 1910.178 Aligned"));
    ok("1d bundle has $45 price anchor", js.includes("Online certification $45.00"));
    ok("1e bundle has requestQuote keys (was raw)", js.includes('"requestQuote"') || /requestQuote/.test(js));
    ok("1f bundle has ES copy", js.includes("Certificación el Mismo Día") || js.includes("Pago Seguro"));
    ok("1g bundle has checkoutTrust.secure value", /Authorize\.net/.test(js));
  }
}

// ─── 2. Guided funnel (both paths) ───
{
  const r1 = await fetch(BASE + "/get-certified");
  ok("2a /get-certified 200", r1.status === 200);
  // individual path → /checkout; crew path → /request-quote (onsite request POST)
  const r2 = await fetch(BASE + "/checkout");
  const r3 = await fetch(BASE + "/request-quote");
  ok("2b /checkout 200", r2.status === 200);
  ok("2c /request-quote 200", r3.status === 200);
  const lead = await fetch(BASE + "/api/onsite-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({
      companyName: "E2E Gate Co", contactName: "E2E Gate Crew Lead",
      email: `peter+miramar-e2e-gate-crew-${stamp}@scaled.services`, phone: "8585550190",
      trainingAddress: "789 Gate Ave", city: "San Diego", state: "CA", zip: "92101",
      traineeCount: 6, equipmentTypes: ["forklift"], trainingType: "Initial Certification",
      notes: "E2E gate crew-path lead",
    }),
  });
  ok("2d crew path lead POST 201", lead.status === 201, `status ${lead.status}`);
}

// ─── 3. Full booking flow ───
let customer = jar();
let bookingId = null;
{
  const zip = await (await fetch(BASE + "/api/service-areas/check?zip=92101")).json();
  ok("3a ZIP 92101 served", zip.available === true, JSON.stringify(zip).slice(0, 80));
  const areaId = zip.serviceArea?.id;

  const slots = await (await fetch(BASE + `/api/available-slots?serviceAreaId=${areaId}&from=2026-07-10&to=2026-07-25`)).json();
  const slot = Array.isArray(slots) ? slots.find((s) => s.available) : null;
  ok("3b available slot found", !!slot, slot ? `${slot.date} ${slot.startTime}` : JSON.stringify(slots).slice(0, 100));

  const email = `peter+miramar-e2e-gate-${stamp}@scaled.services`;
  const reg = await customer.fetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "E2eGate-2026!", name: "E2E Gate Customer", phone: "8585550191" }),
  });
  ok("3c register 201", reg.status === 201, `status ${reg.status}`);

  const payConf = await (await fetch(BASE + "/api/payment/config")).json();
  ok("3d payment config sandbox", payConf.configured && payConf.environment === "sandbox");

  let nonce = null;
  try { nonce = await tokenizeCard(payConf, `e2e-gate-${stamp}`); } catch (e) { ok("3e tokenize card", false, e.message); }
  if (nonce) ok("3e tokenize card", true);

  if (slot && nonce) {
    const bres = await customer.fetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        serviceAreaId: areaId,
        productSlug: "standard-forklift-certification-san-diego",
        productSlugs: ["standard-forklift-certification-san-diego"],
        sessionDate: slot.date, startTime: slot.startTime, endTime: slot.endTime,
        participantCount: 1,
        customerAddress: "123 Gate Dr", customerCity: "San Diego", customerState: "CA", customerZip: "92101",
        contactName: "E2E Gate Customer", contactPhone: "8585550191", contactEmail: email,
        paymentNonce: nonce,
      }),
    });
    const booking = await bres.json().catch(() => ({}));
    bookingId = booking.id;
    ok("3f booking created", bres.status === 200 || bres.status === 201, `status ${bres.status} ${JSON.stringify(booking).slice(0, 120)}`);
    ok("3g total = $280 (100% upfront, 1 person)", booking.totalPrice === "280.00", `totalPrice=${booking.totalPrice}`);
    ok("3h order attached (payment captured)", !!booking.orderId, `orderId=${booking.orderId}`);
    ok("3i booking pending (manual confirm per Alberto)", booking.status === "pending", `status=${booking.status}`);
    if (bookingId) {
      const bal = await (await customer.fetch(`/api/bookings/${bookingId}/balance`)).json();
      ok("3j balance = 0 after full payment", Number(bal.balanceDue ?? bal.balance ?? -1) === 0, JSON.stringify(bal).slice(0, 120));
    }
  }
}

// ─── Manager login (used for 4, 14, 15) ───
const manager = jar();
{
  const res = await manager.fetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "manager@harborlogistics.com", password: "Manager2026!" }),
  });
  ok("M manager login", res.status === 200, `status ${res.status}`);
}

// ─── 4. Pay balance on booking 10 ───
{
  const bal = await (await manager.fetch("/api/bookings/10/balance")).json().catch(() => null);
  ok("4a balance endpoint responds", !!bal, JSON.stringify(bal).slice(0, 140));
  const due = Number(bal?.balanceDue ?? bal?.balance ?? 0);
  if (due > 0.01) {
    const payConf = await (await fetch(BASE + "/api/payment/config")).json();
    let nonce = null;
    try { nonce = await tokenizeCard(payConf, `e2e-gate-bal-${stamp}`); } catch (e) {}
    if (nonce) {
      const pres = await manager.fetch("/api/bookings/10/pay-balance", { method: "POST", body: JSON.stringify({ paymentNonce: nonce }) });
      const pj = await pres.json().catch(() => ({}));
      ok("4b pay balance succeeds", pres.status === 200, `status ${pres.status} ${JSON.stringify(pj).slice(0, 120)}`);
      const bal2 = await (await manager.fetch("/api/bookings/10/balance")).json();
      ok("4c balance now 0", Number(bal2.balanceDue ?? bal2.balance ?? -1) === 0, JSON.stringify(bal2).slice(0, 100));
    } else ok("4b pay balance", false, "tokenize failed");
  } else {
    ok("4b balance already settled (nothing to pay)", true, `due=${due}`);
  }
}

// ─── 5. Cert verify + recert capture ───
{
  const v = await (await fetch(BASE + "/api/verify/MFT-2024-001234")).json().catch(() => null);
  const cert = v?.certification || v;
  ok("5a verify MFT-2024-001234", !!cert && (cert.certificateNumber === "MFT-2024-001234" || cert.valid !== undefined), JSON.stringify(v).slice(0, 140));
  const exp = cert?.expiresAt || cert?.certification?.expiresAt;
  const days = exp ? Math.round((new Date(exp) - Date.now()) / 86400000) : null;
  ok("5b expiry within 90 days (recert callout condition)", days !== null && days <= 90, `expires ${exp} (${days}d)`);
  const ri = await fetch(BASE + "/api/certs/recert-interest", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "E2E Recert Lead", phone: "8585550192", certificateNumber: "MFT-2024-001234" }),
  });
  ok("5c recert-interest lead capture", ri.status === 200 || ri.status === 201, `status ${ri.status}`);
}

// ─── 6. Referral (as manager, authed) ───
{
  const r = await manager.fetch("/api/referrals/mine");
  const j = await r.json().catch(() => null);
  ok("6a referral code endpoint", r.status === 200 && !!(j?.code || j?.referralCode || j?.referral), JSON.stringify(j).slice(0, 140));
}

// ─── 7 + 8. Static pages ───
{
  ok("7 /refund-policy 200", (await fetch(BASE + "/refund-policy")).status === 200);
  const es = await fetch(BASE + "/es/");
  ok("8 /es/ 200", es.status === 200);
}

// ─── Admin login + flows 9-13 ───
const admin = jar();
{
  const res = await admin.fetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "alberto@miramarforklift.com", password: "Admin2026!" }),
  });
  ok("A admin login", res.status === 200, `status ${res.status}`);

  const today = await (await admin.fetch("/api/admin/today")).json().catch(() => null);
  ok("9 /api/admin/today shape", !!today && Array.isArray(today.todaySessions) && Array.isArray(today.week) && Array.isArray(today.newLeads), JSON.stringify(Object.keys(today || {})));

  const bookings = await (await admin.fetch("/api/bookings")).json().catch(() => null);
  const blist = Array.isArray(bookings) ? bookings : bookings?.bookings;
  ok("10a admin bookings list", Array.isArray(blist) && blist.length >= 2, `count=${blist?.length}`);
  const fin = await (await admin.fetch("/api/admin/bookings/10/finance")).json().catch(() => null);
  ok("10b booking 10 finance", !!fin && (fin.total !== undefined || fin.balanceDue !== undefined), JSON.stringify(fin).slice(0, 140));

  const money = await (await admin.fetch("/api/admin/money/summary")).json().catch(() => null);
  ok("11a money summary", !!money?.week && !!money?.month, JSON.stringify(money).slice(0, 140));
  const stmt = await (await admin.fetch("/api/admin/money/statement?month=2026-07")).json().catch(() => null);
  ok("11b statement + split parties", !!stmt?.parties?.alberto && !!stmt?.totals, `revenue=${stmt?.totals?.revenue} alberto=${stmt?.totals?.alberto}`);

  const codes = await (await admin.fetch("/api/admin/discount-codes")).json().catch(() => null);
  const clist = codes?.codes || codes;
  ok("12a discount codes list", Array.isArray(clist) && clist.some((c) => c.code === "ALBERTO10"), JSON.stringify(clist?.[0] || {}).slice(0, 120));
  const val = await (await fetch(BASE + "/api/discount-codes/validate", { method: "POST", headers: { "Content-Type": "application/json", Origin: BASE }, body: JSON.stringify({ code: "ALBERTO10" }) })).json();
  ok("12b validate ALBERTO10", val.valid === true, JSON.stringify(val).slice(0, 100));

  const areas = await (await admin.fetch("/api/service-areas")).json().catch(() => null);
  ok("13 service areas (availability page data)", Array.isArray(areas) && areas.length >= 1 && !!areas[0].availabilityRules, `count=${areas?.length}`);
}

// ─── 14 + 15. Team manager flows ───
{
  const groups = await (await manager.fetch("/api/groups")).json().catch(() => null);
  const glist = groups?.groups || groups;
  ok("14a manager groups", Array.isArray(glist) ? glist.length >= 1 : !!glist, JSON.stringify(glist).slice(0, 120));
  const roster = await (await manager.fetch("/api/roster")).json().catch(() => null);
  const rlist = roster?.roster || roster?.employees || roster;
  ok("14b roster loads", !!rlist && (Array.isArray(rlist) ? true : typeof rlist === "object"), JSON.stringify(rlist).slice(0, 140));

  const binder = await (await manager.fetch("/api/audit-binder/1")).json().catch(() => null);
  ok("15a audit binder data", !!binder && !binder.error, JSON.stringify(binder).slice(0, 140));
  const pdf = await manager.fetch("/api/audit-binder/1/pdf");
  const buf = await pdf.arrayBuffer();
  ok("15b audit binder PDF", pdf.status === 200 && (pdf.headers.get("content-type") || "").includes("pdf") && buf.byteLength > 5000, `status=${pdf.status} type=${pdf.headers.get("content-type")} bytes=${buf.byteLength}`);
}

const fails = results.filter((r) => !r.pass);
console.log(`\n==== ${results.length - fails.length}/${results.length} passed, ${fails.length} failed ====`);
if (fails.length) { console.log("FAILED:"); fails.forEach((f) => console.log(" -", f.name, f.detail)); }
