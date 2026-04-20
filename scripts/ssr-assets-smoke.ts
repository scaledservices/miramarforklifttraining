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

async function testSsrPageAssets(path: string, label: string) {
  console.log(`\n  [${label}] ${path}:`);
  const { status, html, headers } = await fetchHtml(path);

  assert(`${label} returns 200`, status === 200, `Got ${status}`);
  assert(`${label} has X-SSR header`, headers.get("x-ssr") === "true", `X-SSR: ${headers.get("x-ssr")}`);

  const hasStylesheet = html.includes('rel="stylesheet"');
  const hasStyleTag = html.includes('<style');
  const hasCssAsset = html.includes('.css"') || html.includes(".css'");
  assert(
    `${label} has CSS (stylesheet/style tag)`,
    hasStylesheet || hasStyleTag || hasCssAsset,
    `stylesheet: ${hasStylesheet}, style: ${hasStyleTag}, cssAsset: ${hasCssAsset}`
  );

  const hasModuleScript = html.includes('type="module"');
  const hasMainTsx = html.includes("main.tsx");
  const hasAssetJs = /\/assets\/[^"']+\.js/.test(html);
  assert(
    `${label} has JS module script`,
    hasModuleScript && (hasMainTsx || hasAssetJs),
    `module: ${hasModuleScript}, mainTsx: ${hasMainTsx}, assetJs: ${hasAssetJs}`
  );

  const hasViteClient = html.includes("/@vite/client") || html.includes("@react-refresh");
  const isProd = !hasViteClient;
  if (!isProd) {
    assert(`${label} has Vite HMR client (dev)`, hasViteClient, "Missing Vite dev client");
  } else {
    assert(`${label} has production asset references`, hasAssetJs, "Missing /assets/ JS reference");
    assert(`${label} has production CSS`, hasStylesheet, "Missing production CSS link");
  }

  assert(`${label} has fonts stylesheet`, html.includes("fonts.googleapis.com"), "Missing Google Fonts");
  assert(`${label} has favicon`, html.includes("favicon"), "Missing favicon reference");

  const headSection = html.match(/<head[^>]*>([\s\S]*?)<\/head>/);
  if (headSection) {
    const headClean = headSection[1].replace(/<script[\s\S]*?<\/script>/g, "");
    const titleMatch = headClean.match(/<title>([^<]+)<\/title>/);
    assert(`${label} has SEO title in head`, !!titleMatch && titleMatch[1].length > 10, `Title: ${titleMatch?.[1]?.substring(0, 60)}`);
  }

  assert(`${label} has body content`, html.includes('<div id="root">') && !html.includes('<div id="root"></div>'), "Empty root div - no SSR body content");
}

async function testSpaPageAssets(path: string, label: string) {
  console.log(`\n  [${label}] ${path}:`);
  const { status, html } = await fetchHtml(path);

  assert(`${label} returns 200`, status === 200, `Got ${status}`);

  const hasModuleScript = html.includes('type="module"');
  assert(`${label} has JS module script`, hasModuleScript, "Missing module script");

  const hasViteClient = html.includes("/@vite/client") || html.includes("@react-refresh");
  const hasAssetJs = /\/assets\/[^"']+\.js/.test(html);
  assert(
    `${label} has JS assets`,
    hasViteClient || hasAssetJs,
    `viteClient: ${hasViteClient}, assetJs: ${hasAssetJs}`
  );
}

async function run() {
  console.log("=== SSR Assets Smoke Tests ===");

  console.log("\n[1] SSR Pages - Asset Verification:");
  await testSsrPageAssets("/online-forklift-certification", "StaticMoneyPage");
  await testSsrPageAssets("/", "Homepage");
  await testSsrPageAssets("/osha-compliance", "StaticInfoPage");

  console.log("\n[2] DB SEO Pages - Asset Verification:");
  await testSsrPageAssets("/forklift-certification-online", "DbCoursePage");
  await testSsrPageAssets("/forklift-certification-los-angeles-ca", "DbCityPage");

  console.log("\n[3] SPA Pages - Asset Verification:");
  await testSpaPageAssets("/login", "SpaLoginPage");
  await testSpaPageAssets("/dashboard", "SpaDashboard");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${results.length} total ===`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  ✗ ${r.name}: ${r.details}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
