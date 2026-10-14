import { catalog } from "@/data/catalog";
import { EN_TO_ES_SLUG_MAP } from "@shared/course-slug-map";

/**
 * "Buy more seats" link for a crew admin (meeting 2026-10-13): open the
 * product page for the course the crew already trains on, at 1 seat. Product
 * pages are keyed by the catalog slug; seats carry the course slug (EN or ES),
 * so map ES -> EN course, then course -> product. Falls back to the main
 * forklift product.
 */
const DEFAULT_PRODUCT = "online-forklift-operator-training";

export function buyMoreSeatsHref(enrollments: { courseSlug?: string | null }[] | undefined): string {
  const courseSlug = enrollments?.find((e) => e.courseSlug)?.courseSlug;
  let enCourse = courseSlug ?? null;
  if (enCourse) {
    const fromEs = Object.entries(EN_TO_ES_SLUG_MAP).find(([, es]) => es === enCourse);
    if (fromEs) enCourse = fromEs[0];
  }
  const product = catalog.find((p) => p.category === "online" && (p as { courseSlug?: string }).courseSlug === enCourse);
  // crew=1: even a single extra seat is a crew seat, not a personal enrollment.
  return `/p/${product?.slug ?? DEFAULT_PRODUCT}?seats=1&crew=1`;
}
