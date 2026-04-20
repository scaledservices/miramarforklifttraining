import { pool } from "../server/db";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

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

async function fetchHtml(path: string): Promise<{ status: number; html: string; headers: Headers }> {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  const html = await res.text();
  return { status: res.status, html, headers: res.headers };
}

function countOccurrences(str: string, search: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}

function assertCssBeforeScripts(label: string, html: string) {
  const headSection = html.match(/<head[\s>][\s\S]*?<\/head>/)?.[0] || "";
  const cssPos = headSection.indexOf('rel="stylesheet"');
  const moduleScriptPos = headSection.indexOf('type="module" src=');
  if (cssPos !== -1 && moduleScriptPos !== -1) {
    assert(`${label} CSS appears before module script`, cssPos < moduleScriptPos, `CSS at ${cssPos}, script at ${moduleScriptPos}`);
  }
  const hasCssLink = headSection.includes('href="/src/index.css"') || headSection.match(/href="\/assets\/[^"]+\.css"/);
  assert(`${label} has Vite CSS link`, !!hasCssLink, "Missing /src/index.css or /assets/*.css link");
}

async function testSeoDbPage(slug: string, label: string, expectFaq: boolean, expectCourse: boolean) {
  console.log(`\n  [${label}] /${slug}:`);

  const { status, html, headers } = await fetchHtml(`/${slug}`);
  assert(`${label} returns 200`, status === 200, `Got ${status}`);
  assert(`${label} has X-SSR header`, headers.get("x-ssr") === "true", `X-SSR: ${headers.get("x-ssr")}`);

  const headSection = html.match(/<head[\s>][\s\S]*?<\/head>/)?.[0] || "";
  const headTitleMatch = headSection.match(/<title>([^<]+)<\/title>/);
  assert(`${label} has <title>`, !!headTitleMatch && headTitleMatch[1].length > 5, "Missing or empty title in <head>");
  assert(`${label} title is meaningful`, !!headTitleMatch && headTitleMatch[1].length > 10, `Title: ${headTitleMatch?.[1]?.substring(0, 60)}`);

  assert(`${label} has meta description`, html.includes('name="description"') && html.includes('content="'), "Missing meta description");
  assert(`${label} has canonical`, html.includes('rel="canonical"'), "Missing canonical");
  assert(`${label} has og:title`, html.includes('property="og:title"'), "Missing og:title");
  assert(`${label} has og:description`, html.includes('property="og:description"'), "Missing og:description");
  assert(`${label} has og:image`, html.includes('property="og:image"'), "Missing og:image");
  assert(`${label} has twitter:card`, html.includes('name="twitter:card"'), "Missing twitter:card");
  assert(`${label} has hreflang en`, html.includes('hreflang="en"'), "Missing hreflang en");
  assert(`${label} has hreflang x-default`, html.includes('hreflang="x-default"'), "Missing hreflang x-default");

  const jsonLdCount = countOccurrences(html, "application/ld+json");
  assert(`${label} has Organization JSON-LD`, html.includes('"@type":"Organization"'), "Missing Organization schema");

  if (expectFaq) {
    assert(`${label} has FAQPage JSON-LD`, html.includes('"@type":"FAQPage"'), "Missing FAQPage schema");
  }

  if (expectCourse) {
    assert(`${label} has Course JSON-LD`, html.includes('"@type":"Course"'), "Missing Course schema");
  }

  assert(`${label} has BreadcrumbList JSON-LD`, html.includes('"@type":"BreadcrumbList"'), "Missing BreadcrumbList schema");

  assert(`${label} has body content (H1)`, html.includes("<h1>"), "Missing H1 in body");
  assert(`${label} has SPA script tag`, html.includes('type="module"') && (html.includes("main.tsx") || html.includes("/assets/")), "Missing SPA hydration script");
  assert(`${label} has CSS assets`, html.includes('rel="stylesheet"') || html.includes('<style'), "Missing CSS - page will render unstyled");
  assertCssBeforeScripts(label, html);
}

async function testStaticPage(path: string, label: string, expectCourse: boolean = false) {
  console.log(`\n  [${label}] ${path}:`);

  const { status, html, headers } = await fetchHtml(path);
  assert(`${label} returns 200`, status === 200, `Got ${status}`);
  assert(`${label} has X-SSR header`, headers.get("x-ssr") === "true", `X-SSR: ${headers.get("x-ssr")}`);

  const headSection = html.match(/<head[\s>][\s\S]*?<\/head>/)?.[0] || "";
  const headTitleMatch = headSection.match(/<title>([^<]+)<\/title>/);
  assert(`${label} has <title>`, !!headTitleMatch && headTitleMatch[1].length > 5, "Missing or empty title in <head>");
  assert(`${label} has meta description`, html.includes('name="description"'), "Missing meta description");
  assert(`${label} has canonical`, html.includes('rel="canonical"'), "Missing canonical");
  assert(`${label} has og:title`, html.includes('property="og:title"'), "Missing og:title");
  assert(`${label} has Organization JSON-LD`, html.includes('"@type":"Organization"'), "Missing Organization schema");
  assert(`${label} has body content (H1)`, html.includes("<h1>"), "Missing H1 in body");
  assert(`${label} has CSS assets`, html.includes('rel="stylesheet"') || html.includes('<style'), "Missing CSS - page will render unstyled");
  assert(`${label} has SPA script`, html.includes('type="module"') && (html.includes("main.tsx") || html.includes("/assets/")), "Missing SPA script");
  assertCssBeforeScripts(label, html);

  if (expectCourse) {
    assert(`${label} has Course JSON-LD`, html.includes('"@type":"Course"'), "Missing Course schema");
    assert(`${label} Course has price`, html.includes('"price":59.99'), "Missing price in Course schema");
  }
}

async function testNonSsrPage(path: string, label: string) {
  console.log(`\n  [${label}] ${path}:`);

  const { html, headers } = await fetchHtml(path);
  const isSSR = headers.get("x-ssr") === "true";
  assert(`${label} is NOT SSR'd`, !isSSR, `X-SSR: ${headers.get("x-ssr")}`);
  assert(`${label} has generic SPA title`, html.includes("ForkliftCertified | OSHA-Aligned"), "Unexpected title");
}

async function testSitemap() {
  console.log("\n  [Sitemap] /sitemap.xml:");

  const { status, html } = await fetchHtml("/sitemap.xml");
  assert("Sitemap returns 200", status === 200, `Got ${status}`);
  assert("Sitemap is valid XML", html.startsWith("<?xml"), "Missing XML declaration");
  assert("Sitemap contains online-forklift-certification", html.includes("online-forklift-certification"), "Missing money page");

  const locCount = countOccurrences(html, "<loc>");
  assert("Sitemap has 100+ URLs", locCount >= 100, `Only ${locCount} URLs found`);

  assert("Sitemap excludes /admin", !html.includes("<loc>https://forkliftcertified.training/admin"), "Found /admin");
  assert("Sitemap excludes /dashboard", !html.includes("/dashboard"), "Found /dashboard");
  assert("Sitemap excludes /login", !html.includes("/login"), "Found /login");
}

async function testRobots() {
  console.log("\n  [Robots] /robots.txt:");

  const { status, html } = await fetchHtml("/robots.txt");
  assert("Robots returns 200", status === 200, `Got ${status}`);
  assert("Robots references sitemap", html.includes("Sitemap: https://forkliftcertified.training/sitemap.xml"), "Missing sitemap ref");
  assert("Robots disallows /admin", html.includes("Disallow: /admin"), "Missing /admin disallow");
  assert("Robots disallows /dashboard", html.includes("Disallow: /dashboard"), "Missing /dashboard disallow");
}

async function testRedirects() {
  console.log("\n  [Redirects]:");

  for (const slug of ["osha-forklift-certification", "forklift-license", "forklift-training"]) {
    const res = await fetch(`${BASE_URL}/${slug}`, { redirect: "manual" });
    assert(`/${slug} returns 301`, res.status === 301, `Got ${res.status}`);
    const location = res.headers.get("location") || "";
    assert(`/${slug} → /online-forklift-certification`, location === "/online-forklift-certification", `Location: ${location}`);
  }
}

async function run() {
  console.log("=== SSR Smoke Tests ===");

  console.log("\n[1] Static Marketing Pages (SSR):");
  await testStaticPage("/online-forklift-certification", "OnlineCert", true);
  await testStaticPage("/", "Homepage");
  await testStaticPage("/osha-compliance", "OSHA");

  console.log("\n[2] DB SEO Pages (SSR):");
  await testSeoDbPage("forklift-certification-online", "CourseMoneyPage", true, true);
  await testSeoDbPage("forklift-certification-cost", "PricingPage", true, false);
  await testSeoDbPage("forklift-certification-near-me", "NearMeHub", true, false);
  await testSeoDbPage("forklift-certification-california", "StatePage", true, false);
  await testSeoDbPage("forklift-certification-los-angeles-ca", "CityPage", true, false);
  await testSeoDbPage("forklift-certification-warehouse", "IndustryPage", true, false);
  await testSeoDbPage("sit-down-counterbalance-forklift-training", "EquipmentPage", true, false);

  console.log("\n[3] Non-SSR Pages (SPA only):");
  await testNonSsrPage("/dashboard", "Dashboard");
  await testNonSsrPage("/admin", "Admin");
  await testNonSsrPage("/login", "Login");

  console.log("\n[4] Technical SEO:");
  await testSitemap();
  await testRobots();
  await testRedirects();

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
