import { pool } from "../server/db";

const BASE_URL = "http://localhost:5000";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  if (!condition) {
    console.error(`  ✗ ${name}: ${details}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

async function fetchText(path: string): Promise<{ status: number; text: string; headers: Headers }> {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

async function fetchJson(path: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`);
  const data = await res.json();
  return { status: res.status, data };
}

async function testCanonicalPage() {
  console.log("\n[A] Canonical & Redirect Tests:");

  const { status, text } = await fetchText("/online-forklift-certification");
  assert("Canonical page returns 200", status === 200, `Got ${status}`);

  for (const slug of ["osha-forklift-certification", "forklift-license", "forklift-training"]) {
    const r = await fetchText(`/${slug}`);
    assert(`/${slug} returns 301`, r.status === 301, `Got ${r.status}`);
    const location = r.headers.get("location") || "";
    assert(`/${slug} redirects to /online-forklift-certification`, location === "/online-forklift-certification", `Redirects to: ${location}`);
  }

  const seoPage = await fetchJson("/api/seo/pages/forklift-certification-online");
  assert("forklift-certification-online has self-referential canonical", seoPage.status === 200 && seoPage.data.page?.canonicalSlug === "forklift-certification-online", `canonicalSlug: ${seoPage.data.page?.canonicalSlug}`);
}

async function testSitemap() {
  console.log("\n[B] Sitemap & Indexing Tests:");

  const { status, text } = await fetchText("/sitemap.xml");
  assert("Sitemap returns 200", status === 200, `Got ${status}`);
  assert("Sitemap is valid XML", text.startsWith("<?xml"), "Missing XML declaration");
  assert("Sitemap does NOT contain /admin", !text.includes("/admin"), "Found /admin in sitemap");
  assert("Sitemap does NOT contain /login", !text.includes("/login"), "Found /login in sitemap");
  assert("Sitemap does NOT contain /dashboard", !text.includes("/dashboard"), "Found /dashboard in sitemap");
  assert("Sitemap does NOT contain /api/", !text.includes("/api/"), "Found /api/ in sitemap");
  assert("Sitemap contains homepage", text.includes("<loc>https://forkliftcertified.training</loc>"), "Missing homepage");
  assert("Sitemap contains canonical money page", text.includes("forklift-certification-online"), "Missing forklift-certification-online");
  assert("Sitemap contains a state page", text.includes("forklift-certification-california"), "Missing state page");
  assert("Sitemap contains a city page", text.includes("forklift-certification-los-angeles-ca"), "Missing city page");
  assert("Sitemap does NOT contain redirect slugs",
    !text.includes("/osha-forklift-certification<") &&
    !text.includes("/forklift-license<") &&
    !text.includes("/forklift-training<"),
    "Found redirect slug in sitemap");
}

async function testRobotsTxt() {
  console.log("\n[B] Robots.txt Tests:");

  const { status, text } = await fetchText("/robots.txt");
  assert("Robots.txt returns 200", status === 200, `Got ${status}`);
  assert("Robots.txt disallows /admin", text.includes("Disallow: /admin"), "Missing /admin disallow");
  assert("Robots.txt disallows /dashboard", text.includes("Disallow: /dashboard"), "Missing /dashboard disallow");
  assert("Robots.txt disallows /login", text.includes("Disallow: /login"), "Missing /login disallow");
  assert("Robots.txt disallows /group", text.includes("Disallow: /group"), "Missing /group disallow");
  assert("Robots.txt references sitemap", text.includes("Sitemap: https://forkliftcertified.training/sitemap.xml"), "Missing sitemap reference");
}

async function testCityPage() {
  console.log("\n[C/D] City Page Content & Internal Links:");

  const { status, data } = await fetchJson("/api/seo/pages/forklift-certification-los-angeles-ca");
  assert("City page returns 200", status === 200, `Got ${status}`);
  assert("City page has H1", !!data.page?.heroH1, `heroH1: ${data.page?.heroH1}`);
  assert("City page has meta description", !!data.page?.metaDescription && data.page.metaDescription.length > 20, `metaDescription length: ${data.page?.metaDescription?.length}`);
  assert("City page has canonical", !!data.page?.canonicalSlug, `canonicalSlug: ${data.page?.canonicalSlug}`);

  const body = JSON.stringify(data.page?.bodySections || []);
  const intro = data.page?.introParagraph || "";
  const faqs = data.page?.faqJson || [];
  const totalLen = body.length + intro.length + JSON.stringify(faqs).length;
  assert("City page has 900+ words of content", totalLen > 2000, `Total content length: ${totalLen} chars`);
  assert("City page has 6+ FAQs", faqs.length >= 6, `FAQ count: ${faqs.length}`);
  assert("City page FAQs mention city name", faqs.some((f: any) => f.q.includes("Los Angeles") || f.a.includes("Los Angeles")), "No LA mention in FAQs");
  assert("City page body mentions local industry", body.includes("industry") || body.includes("employer") || body.includes("economy"), "No industry context in body");

  const related = await fetchJson("/api/seo/related/forklift-certification-los-angeles-ca");
  assert("Related endpoint returns hub links", (related.data.hubLinks || []).length > 0, `hubLinks: ${related.data.hubLinks?.length}`);
  const hubSlugs = (related.data.hubLinks || []).map((h: any) => h.slug);
  assert("Hub links include canonical money page", hubSlugs.includes("online-forklift-certification"), `Hub link slugs: ${hubSlugs.join(", ")}`);
  assert("Hub links include state page", hubSlugs.some((s: string) => s.includes("california")), `Hub link slugs: ${hubSlugs.join(", ")}`);
  assert("Hub links include near-me hub", hubSlugs.includes("forklift-certification-near-me"), `Hub link slugs: ${hubSlugs.join(", ")}`);
  assert("Related includes nearby cities", (related.data.nearby || []).length > 0, `Nearby count: ${related.data.nearby?.length}`);
}

async function testStatePage() {
  console.log("\n[D] State Page Content:");

  const { status, data } = await fetchJson("/api/seo/pages/forklift-certification-california");
  assert("State page returns 200", status === 200, `Got ${status}`);
  const body = JSON.stringify(data.page?.bodySections || []);
  const intro = data.page?.introParagraph || "";
  const faqs = data.page?.faqJson || [];
  const totalLen = body.length + intro.length + JSON.stringify(faqs).length;
  assert("State page has 900+ words of content", totalLen > 2000, `Total content length: ${totalLen} chars`);
  assert("State page has 6+ FAQs", faqs.length >= 6, `FAQ count: ${faqs.length}`);
  assert("State page body mentions state economy", body.includes("economy") || body.includes("Economy"), "No economy context");
  assert("State page has step_list section", body.includes("step_list"), "Missing how-to steps");
  assert("State page has self-referential canonical", data.page?.canonicalSlug === data.page?.slug, `canonical: ${data.page?.canonicalSlug} vs slug: ${data.page?.slug}`);
}

async function testAdminHealth() {
  console.log("\n[B] Admin Health Check (unauthenticated — expects 401):");

  const { status } = await fetchJson("/api/admin/seo-health");
  assert("Admin health requires auth", status === 401, `Got ${status}`);
}

async function run() {
  console.log("=== SEO Smoke Tests ===");

  await testCanonicalPage();
  await testSitemap();
  await testRobotsTxt();
  await testCityPage();
  await testStatePage();
  await testAdminHealth();

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${results.length} total ===`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  ✗ ${r.name}: ${r.details}`);
    }
  }

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
