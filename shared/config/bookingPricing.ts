// Authoritative booking prices — single source of truth shared by the client
// (display) and the server (charge computation). Values mirror the hands-on
// catalog entries; update BOTH here and client/src/data/catalog.ts if a price
// changes until catalog pricing is fully migrated to this map.

export const BOOKING_PRODUCT_PRICES: Record<string, number> = {
  "standard-forklift-certification-san-diego": 280,
  "scissor-aerial-boom-lift-certification-san-diego": 200,
  "reach-training-certification-san-diego": 300,
  "order-picker-training-certification-san-diego": 300,
  "reach-forklift-training-san-diego": 490,
  "order-picker-forklift-training-san-diego": 490,
  "forklift-scissor-lift-epj-certification-san-diego": 550,
  "complete-equipment-certification-san-diego": 650,
  "standard-forklift-certification-las-vegas": 280,
  "scissor-aerial-boom-lift-certification-las-vegas": 200,
  "reach-training-certification-las-vegas": 300,
  "order-picker-training-certification-las-vegas": 300,
  "reach-forklift-training-las-vegas": 490,
  "order-picker-forklift-training-las-vegas": 490,
  "forklift-scissor-lift-epj-certification-las-vegas": 550,
  "complete-equipment-certification-las-vegas": 650,
  "standard-forklift-certification-fresno": 280,
};

// ── Booking add-on upsell catalog ─────────────────────────────────
// Keyed by BASE product slug. Each entry lists compatible add-on products
// offered as an opt-in upsell during the self-serve booking flow. Add-on
// slugs MUST exist in BOOKING_PRODUCT_PRICES above — the per-person price is
// always looked up there, never duplicated here. Fresno intentionally has no
// entry: it only offers standard forklift certification.
export interface BookingAddon {
  slug: string;
  name: string;
}

export const BOOKING_ADDONS: Record<string, BookingAddon[]> = {
  "standard-forklift-certification-san-diego": [
    {
      slug: "scissor-aerial-boom-lift-certification-san-diego",
      name: "Standard Scissor & Aerial/Boom Lift Certification",
    },
  ],
  "standard-forklift-certification-las-vegas": [
    {
      slug: "scissor-aerial-boom-lift-certification-las-vegas",
      name: "Standard Scissor & Aerial/Boom Lift Certification",
    },
  ],
};

// Add-ons compatible with the given selected base slugs, deduped. Add-ons the
// customer already selected are still returned so the UI can render them in a
// checked state (toggling off removes them).
export function getAddonsForProducts(selectedSlugs: string[]): BookingAddon[] {
  const seen = new Set<string>();
  const out: BookingAddon[] = [];
  for (const slug of selectedSlugs) {
    for (const addon of BOOKING_ADDONS[slug] ?? []) {
      if (seen.has(addon.slug)) continue;
      seen.add(addon.slug);
      out.push(addon);
    }
  }
  return out;
}

// Automated volume discount advertised sitewide ("volume discounts for 5+").
export const VOLUME_DISCOUNT_MIN_PARTICIPANTS = 5;
export const VOLUME_DISCOUNT_RATE = 0.10;

// Onsite bookings collect a deposit at booking time; balance is due on completion.
export const BOOKING_DEPOSIT_RATE = 0.5;

export interface BookingPriceBreakdown {
  perPerson: number;
  participantCount: number;
  subtotal: number;
  volumeDiscount: number;
  total: number;
  deposit: number;
  balance: number;
}

export function computeBookingPrice(productSlugs: string[], participantCount: number): BookingPriceBreakdown | null {
  if (!Array.isArray(productSlugs) || productSlugs.length === 0) return null;
  if (!Number.isInteger(participantCount) || participantCount < 1) return null;
  let perPerson = 0;
  for (const slug of productSlugs) {
    const price = BOOKING_PRODUCT_PRICES[slug];
    if (price === undefined) return null;
    perPerson += price;
  }

  const subtotal = perPerson * participantCount;
  const volumeDiscount = participantCount >= VOLUME_DISCOUNT_MIN_PARTICIPANTS
    ? round2(subtotal * VOLUME_DISCOUNT_RATE)
    : 0;
  const total = round2(subtotal - volumeDiscount);
  const deposit = round2(total * BOOKING_DEPOSIT_RATE);
  const balance = round2(total - deposit);
  return { perPerson, participantCount, subtotal: round2(subtotal), volumeDiscount, total, deposit, balance };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
