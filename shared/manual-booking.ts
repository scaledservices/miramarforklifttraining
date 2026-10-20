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

/** Every city can be booked for these, at the facility or the customer's site
 *  (Alberto 2026-10-16). Prefix of the catalog slug, location suffix dropped. */
const EVERY_CITY_PROGRAMS = [
  "standard-forklift-certification",
  "scissor-aerial-boom-lift-certification",
  "forklift-train-the-trainer",
  "scissor-aerial-train-the-trainer",
];

/** Programs offered at the area's facility (hands-on + Train the Trainer), one
 *  entry per program. The standard scissor lift program is only in the public
 *  catalog for San Diego; for the other cities it is offered here (manual
 *  booking only) from the San Diego entry, under a city-specific slug. */
export function programsForArea<T extends ProgramLike>(catalog: T[], areaSlug: string | undefined): T[] {
  const facility = areaSlug ? AREA_FACILITY[areaSlug] : undefined;
  if (!facility) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  const add = (p: T) => {
    if (seen.has(p.title)) return;
    seen.add(p.title);
    out.push(p);
  };
  for (const p of catalog) {
    if (p.category === "hands-on" && p.location === facility) add(p);
  }
  for (const base of EVERY_CITY_PROGRAMS) {
    const here = catalog.find((p) => p.slug === `${base}-${facility}`);
    if (here) { add(here); continue; }
    const template = catalog.find((p) => p.slug.startsWith(`${base}-`) && p.location && p.location !== "online");
    if (template) add({ ...template, slug: `${base}-${facility}`, location: facility });
  }
  for (const p of catalog) {
    if (p.category === "trainer" && p.location === facility) add(p);
  }
  return out;
}

/** Program price x participants, as a 2-decimal string ("" if unknown). */
export function autoPrice(price: number | undefined, participants: string | number): string {
  const n = Number(participants);
  if (!price || !Number.isFinite(n) || n < 1) return "";
  return (price * Math.floor(n)).toFixed(2);
}
