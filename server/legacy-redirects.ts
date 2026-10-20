import type { Request, Response, NextFunction } from "express";

/**
 * Legacy WordPress/WooCommerce/LearnDash URLs from the old
 * training.miramarforklift.com site -> best page on the new app (301).
 *
 * Source list: the old site's Yoast sitemaps (page, product, product_cat,
 * product_tag, post, category, post_tag, ld_course_language, author,
 * tp_event_speaker, edubin_megamenu), captured before the DNS cutover.
 * Product mappings were made from each old product page's <title>/<h1>.
 *
 * Keys are normalized: lowercase, no trailing slash, no query string.
 * Never add a key that the new app serves itself (see LEGACY_PROTECTED_*
 * and the test in scripts/legacy-redirects.test.ts).
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  // ── Products (/product/<slug>) ──────────────────────────────────────
  // Online
  "/product/osha-forklift-operator-training": "/p/online-forklift-operator-training",
  "/product/powered-industrial-trucks-forklift-operator-training": "/p/online-forklift-operator-training", // old URL, WP forwarded it to osha-forklift-operator-training
  "/product/powered-industrial-trucks-forklift-operator-training-spanish": "/es/p/online-forklift-operator-training",
  "/product/powered-industrial-trucks-forklift-operator-training-team-2": "/business/products", // EN team purchase
  "/product/powered-industrial-trucks-forklift-operator-training-team": "/es/empresas/productos", // ES team purchase ("Equipo")
  // Kits & cards
  "/product/certification-cards": "/p/certification-cards",
  "/product/forklift-train-the-trainer-kit": "/p/forklift-train-the-trainer-kit",
  "/product/scissor-lift-train-the-trainer-kit": "/p/scissor-lift-train-the-trainer-kit",
  "/product/miramar-forklift-training-certification-kit": "/p/forklift-training-certification-kit",
  // Train the Trainer (on-site)
  "/product/forklift-train-the-trainer-certification": "/p/forklift-train-the-trainer-san-diego",
  "/product/forklift-train-the-trainer-certification-2": "/p/forklift-train-the-trainer-las-vegas",
  "/product/forklift-train-the-trainer-certification-copy": "/p/scissor-aerial-train-the-trainer-san-diego",
  "/product/forklift-train-the-trainer-certification-copy-las-vegas": "/p/scissor-aerial-train-the-trainer-las-vegas",
  // San Diego hands-on
  "/product/standard-forklift-certification-sit-down-lpg-or-epj-san-diego-ca-3": "/p/standard-forklift-certification-san-diego",
  "/product/standard-scissor-aerial-lift-jlg-1930-certification-san-diego-ca": "/p/scissor-aerial-boom-lift-certification-san-diego",
  "/product/standard-scissor-aerial-lift-jlg-1930-certification-san-diego-ca-3": "/p/scissor-aerial-boom-lift-certification-san-diego",
  "/product/reach-training-certification-san-diego-ca": "/p/reach-training-certification-san-diego",
  "/product/reach-training-certification-san-diego-ca-2": "/p/reach-training-certification-san-diego",
  "/product/order-picker-training-certification-san-diego-ca-2": "/p/order-picker-training-certification-san-diego",
  "/product/hands-on-reach-forklift-training-sit-down-lpg-reach-san-diego-ca-2": "/p/reach-forklift-training-san-diego",
  "/product/hands-on-order-picker-forklift-training-sit-down-lpg-order-picker-san-diego-ca-2": "/p/order-picker-forklift-training-san-diego",
  "/product/forklift-scissor-lift-epj-certificationsit-down-lpg-order-picker-san-diego-ca-copy": "/p/forklift-scissor-lift-epj-certification-san-diego",
  "/product/forklift-scissor-lift-order-picker-reach-epj-certification-sit-down-lpg-scissor-jlg-1930-order-picker-or-reach-epj-san-diego-ca": "/p/complete-equipment-certification-san-diego",
  // Las Vegas hands-on (old slugs reuse "san-diego-ca"; titles say Las Vegas)
  "/product/standard-forklift-certification-sit-down-lpg-or-epj-san-diego-ca-2": "/p/standard-forklift-certification-las-vegas",
  "/product/reach-training-certification-las-vegas": "/p/reach-training-certification-las-vegas",
  "/product/order-picker-training-certification-las-vegas": "/p/order-picker-training-certification-las-vegas",
  "/product/hands-on-reach-forklift-training-sit-down-lpg-reach-las-vegas": "/p/reach-forklift-training-las-vegas",
  "/product/hands-on-order-picker-forklift-training-sit-down-lpg-order-picker-las-vegas": "/p/order-picker-forklift-training-las-vegas",
  // No Las Vegas scissor/combo product on the new site -> nearest LV page
  "/product/standard-scissor-aerial-lift-jlg-1930-certification-san-diego-ca-2": "/locations/las-vegas",
  "/product/forklift-scissor-lift-epj-certificationsit-down-lpg-order-picker-san-diego-ca-copy-2": "/p/standard-forklift-certification-las-vegas",
  "/product/forklift-scissor-lift-order-picker-reach-epj-certification-sit-down-lpg-scissor-jlg-1930-order-picker-or-reach-epj-las-vegas": "/p/standard-forklift-certification-las-vegas",
  // Fresno hands-on
  "/product/standard-forklift-certification-sit-down-lpg-or-epj-san-diego-ca-2-2": "/p/standard-forklift-certification-fresno",

  // ── Product categories / tags ───────────────────────────────────────
  "/product-category/online": "/online-forklift-certification",
  "/product-category/online-individual": "/online-forklift-certification",
  "/product-category/online-team": "/business/products",
  "/product-category/san-diego": "/locations/san-diego",
  "/product-category/las-vegas": "/locations/las-vegas",
  "/product-category/fresno": "/locations/fresno",
  "/product-category/train-the-trainer": "/train-the-trainer",
  "/product-category/train-the-trainer-kit": "/train-the-trainer",
  "/product-category/train-the-trainer-onsite": "/train-the-trainer",
  "/product-category/products": "/training-programs",
  "/product-category/uncategorized": "/training-programs",
  "/product-tag/san-diego": "/locations/san-diego",
  "/product-tag/las-vegas": "/locations/las-vegas",
  "/ld_course_language/english": "/training-programs",

  // ── Pages ───────────────────────────────────────────────────────────
  "/faqs": "/faq",
  "/faqs-2": "/faq",
  "/about": "/",
  "/about-us": "/",
  "/about-2": "/",
  "/privacy-policy-2": "/privacy",
  "/term-conditions": "/terms",
  "/lp-term-conditions": "/terms",
  "/shop": "/training-programs",
  "/shop-2": "/training-programs",
  "/courses": "/training-programs",
  "/filter-category": "/training-programs",
  "/ld-advanced-course-filter": "/training-programs",
  "/my-account": "/dashboard",
  "/my-account-2": "/dashboard",
  "/account": "/dashboard",
  "/user-account": "/dashboard",
  "/user-account-2": "/dashboard",
  "/profile": "/dashboard",
  "/learndash-profile": "/dashboard",
  "/lp-profile": "/dashboard",
  "/course-completed": "/dashboard",
  "/course-completed-2": "/dashboard",
  "/user-login": "/login",
  "/user-login-2": "/login",
  "/user-register": "/register",
  "/user-register-2": "/register",
  "/registration": "/register",
  "/registration-success": "/register",
  "/forgot-password": "/reset-password",
  "/forgot-password-2": "/reset-password",
  "/reset-password-2": "/reset-password",
  "/reset-password-3": "/reset-password",
  "/blog-2": "/blog",
  "/blog-grid": "/blog",
  "/groups-dashboard": "/group",
  "/group-report": "/group",
  "/group-management": "/group",
  "/instructors": "/become-an-instructor",
  "/instructor": "/become-an-instructor",
  "/lp-become-a-teacher": "/become-an-instructor",
  // Theme/demo junk
  "/maintenance": "/",
  "/coming-soon": "/",
  "/sample-page": "/",
  "/wishlist": "/",
  "/submit-event-form-page": "/",
  "/event-dashboard-page": "/",
  "/event-dashboard-page/my-registrations": "/",
  "/submit-organizer-form": "/",
  "/submit-venue-form": "/",
  "/venue-dashboard": "/",
  "/organizer-dashboard": "/",
  "/event-organizers": "/",
  "/event-venues": "/",
  "/event-listings": "/",
  "/edubin_megamenu/mega-menu": "/",

  // ── Posts / blog archives (old posts were theme demo content) ───────
  "/blog-lists": "/blog",
  "/how-to-turn-education-into-success-2": "/blog",
  "/how-to-turn-education-into-success-2-2": "/blog",
  "/category/education": "/blog",
};

/** Generic WooCommerce/LearnDash/WordPress prefixes for URLs not in the map. */
export const LEGACY_PREFIX_REDIRECTS: Array<[prefix: string, target: string]> = [
  ["/product/", "/training-programs"],
  ["/product-category/", "/training-programs"],
  ["/product-tag/", "/training-programs"],
  ["/shop/", "/training-programs"],
  ["/courses/", "/dashboard"],
  ["/lessons/", "/dashboard"],
  ["/topic/", "/dashboard"],
  ["/quizzes/", "/dashboard"],
  ["/my-account/", "/dashboard"],
  ["/checkout/", "/cart"],
  ["/category/", "/blog"],
  ["/tag/", "/blog"],
  ["/author/", "/"],
  ["/event-speaker/", "/"],
  ["/ld_course_language/", "/training-programs"],
];

/** WordPress-only paths: 410 Gone (no WordPress here anymore). */
const GONE_EXACT = new Set(["/wp-login.php", "/xmlrpc.php", "/wp-admin", "/wp-content", "/wp-includes", "/wp-json"]);
const GONE_PREFIXES = ["/wp-admin/", "/wp-content/", "/wp-includes/", "/wp-json/"];

/** Paths the new app owns — never redirected, whatever the map says. */
export const LEGACY_PROTECTED_PREFIXES = ["/api/", "/es/", "/en/", "/assets/", "/uploads/"];
const PROTECTED_EXACT = new Set(["/api", "/es", "/en", "/assets", "/uploads"]);

export function normalizeLegacyPath(rawPath: string): string {
  let p = rawPath.split("?")[0].split("#")[0];
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep raw */
  }
  p = p.toLowerCase().replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

export type LegacyResolution =
  | { type: "redirect"; location: string }
  | { type: "gone" }
  | null;

export function resolveLegacyPath(rawPath: string): LegacyResolution {
  const p = normalizeLegacyPath(rawPath);
  if (PROTECTED_EXACT.has(p) || LEGACY_PROTECTED_PREFIXES.some((pre) => p.startsWith(pre))) return null;
  if (GONE_EXACT.has(p) || GONE_PREFIXES.some((pre) => p.startsWith(pre))) return { type: "gone" };
  const exact = LEGACY_REDIRECTS[p];
  if (exact) return { type: "redirect", location: exact };
  for (const [prefix, target] of LEGACY_PREFIX_REDIRECTS) {
    if (p.startsWith(prefix) && p.length > prefix.length) return { type: "redirect", location: target };
  }
  return null;
}

export function legacyRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const hit = resolveLegacyPath(req.originalUrl || req.url);
  if (!hit) return next();
  if (hit.type === "gone") {
    res.status(410).type("text/plain").send("410 Gone");
    return;
  }
  res.redirect(301, hit.location);
}
