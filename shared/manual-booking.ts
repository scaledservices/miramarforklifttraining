/**
 * Manual booking helpers (Alberto meeting 2026-10-14). DB-free so they can be
 * unit-tested.
 */

/** Booking service-area slug -> training facility (catalog `location`). */
export const AREA_FACILITY: Record<string, string> = {
  "southern-california": "san-diego",
  "central-california": "fresno",
  "southern-nevada": "las-vegas",
};

export interface ProgramLike {
  slug: string;
  title: string;
  price: number;
  category: string;
  location?: string;
}

/** Hands-on programs offered at the area's facility, one entry per program. */
export function programsForArea<T extends ProgramLike>(catalog: T[], areaSlug: string | undefined): T[] {
  const facility = areaSlug ? AREA_FACILITY[areaSlug] : undefined;
  if (!facility) return [];
  const seen = new Set<string>();
  return catalog.filter((p) => {
    if (p.category !== "hands-on" || p.location !== facility) return false;
    if (seen.has(p.title)) return false;
    seen.add(p.title);
    return true;
  });
}

/** Program price x participants, as a 2-decimal string ("" if unknown). */
export function autoPrice(price: number | undefined, participants: string | number): string {
  const n = Number(participants);
  if (!price || !Number.isFinite(n) || n < 1) return "";
  return (price * Math.floor(n)).toFixed(2);
}
