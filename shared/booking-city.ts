/**
 * Booking city consistency (prod bug LV-1116-02, 2026-11-14): a booking for
 * the Las Vegas service area was saved with a San Diego product slug because
 * the product preselected from a city-specific URL survived a city change.
 * Pure helpers shared by the booking page and POST /api/bookings.
 */
import { AREA_FACILITY } from "./manual-booking";

export const FACILITY_SLUGS = ["san-diego", "las-vegas", "fresno"] as const;

/** Facility suffix of a city-specific product slug, or null. */
export function slugFacility(slug: string): string | null {
  for (const f of FACILITY_SLUGS) if (slug.endsWith(`-${f}`)) return f;
  return null;
}

/** Product slug without its city suffix ("standard-forklift-certification"). */
export function slugBase(slug: string): string {
  const f = slugFacility(slug);
  return f ? slug.slice(0, -(f.length + 1)) : slug;
}

export interface ProductLike {
  slug: string;
  category: string;
  location?: string;
}

/**
 * Remap selected products to the same program at `facility`. Products the
 * new city does not offer are returned in `dropped`. Order is kept, dupes removed.
 */
export function remapProductsToFacility<T extends ProductLike>(
  selected: T[],
  facility: string,
  catalog: T[],
): { products: T[]; dropped: T[] } {
  const products: T[] = [];
  const dropped: T[] = [];
  const seen = new Set<string>();
  for (const p of selected) {
    const target = `${slugBase(p.slug)}-${facility}`;
    const match = catalog.find((c) => c.slug === target && c.category === p.category && c.location === facility);
    if (!match) { dropped.push(p); continue; }
    if (seen.has(match.slug)) continue;
    seen.add(match.slug);
    products.push(match);
  }
  return { products, dropped };
}

/**
 * Slugs whose city does not match the service area's facility. Unknown areas
 * (QA rows without a facility mapping) are not checked. Slugs without a city
 * suffix are treated as mismatches when the area is known.
 */
export function slugsNotInArea(slugs: string[], areaSlug: string | undefined | null): string[] {
  const facility = areaSlug ? AREA_FACILITY[areaSlug] : undefined;
  if (!facility) return [];
  return slugs.filter((s) => slugFacility(s) !== facility);
}

/** Catalog-looking product slugs inside the joined display string sent as bookings.productSlug. */
export function slugsInDisplayString(productSlug: string, known: Record<string, unknown>): string[] {
  return productSlug.split(/\s*[+|]\s*/).map((s) => s.trim()).filter((s) => s in known);
}
