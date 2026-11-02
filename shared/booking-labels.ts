/**
 * Human-readable labels for bookings in emails, receipts and the admin
 * (Alberto 2026-10-27: emails showed "standard-forklift-certification-las-vegas"
 * and an unlabeled address).
 */
import { locations, LOCATION_SLUGS } from "./config/locations";

const UPPER = new Set(["epj", "osha", "lpg", "id", "ttt"]);

/** "forklift-scissor-lift-epj-certification-san-diego" -> "Forklift Scissor Lift EPJ Certification San Diego" */
export function humanizeSlug(slug: string): string {
  return String(slug || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => (UPPER.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

const SLUGGY = /^[a-z0-9]+(-[a-z0-9]+)+$/;

/**
 * Display name for a booking's productSlug field. It may be one slug, several
 * joined slugs ("a, b" / "a + b"), or already a display string (left as is).
 * The city suffix becomes "(Las Vegas)".
 */
export function trainingLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parts = raw.split(/\s*[,+]\s*/).filter(Boolean);
  if (!parts.every((p) => SLUGGY.test(p))) return raw;
  return parts
    .map((slug) => {
      const city = LOCATION_SLUGS.find((c) => slug.endsWith(`-${c}`));
      const base = city ? slug.slice(0, -(city.length + 1)) : slug;
      const name = humanizeSlug(base);
      return city ? `${name} (${locations[city].city})` : name;
    })
    .join(" + ");
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[.,#]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Where the training happens, labeled: our facility (customer comes to us) or
 * the customer's site (the address they gave for on-site training).
 */
export function bookingLocation(addr: { address?: string | null; city?: string | null; state?: string | null; zip?: string | null }): { label: string; text: string; atFacility: boolean } {
  const street = String(addr.address ?? "").trim();
  const cityLine = [addr.city, [addr.state, addr.zip].filter(Boolean).join(" ")].filter((s) => String(s ?? "").trim()).join(", ");
  const facility = LOCATION_SLUGS.map((s) => locations[s]).find((l) => street && norm(l.address.street) === norm(street));
  if (facility) {
    return { label: "Training Location", text: `Miramar ${facility.city} facility: ${facility.address.full}`, atFacility: true };
  }
  return { label: "On-site Address (customer)", text: [street, cityLine].filter(Boolean).join(", "), atFacility: false };
}

/** "BK-2026-0016": year + zero-padded sequence (replaces BK-<timestamp>-<random>). */
export function formatBookingNumber(year: number, seq: number): string {
  return `BK-${year}-${String(seq).padStart(4, "0")}`;
}
