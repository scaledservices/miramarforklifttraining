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
