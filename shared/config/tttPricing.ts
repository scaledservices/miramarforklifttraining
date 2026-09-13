// Distance-based on-site / Train-the-Trainer pricing (2026-09-07, Alberto).
// Model: FLAT PER SESSION (per trainer trip), NOT per person. Distance from
// the Miramar HQ facility to the customer site sets a travel surcharge; 3+
// participants waives the travel fee entirely. Anchored to Alberto's tiers:
//   <=50 mi = $750 | 51-100 mi = $800 | 100+ mi = $850 | 3+ participants = $750
// Cap $850 keeps Miramar ~20% under Forklift Academy's $900 ceiling.
//
// Distance is computed server-side from a bundled static ZIP->lat/long table
// (no paid geocoding/routing API): haversine great-circle miles x ROAD_FACTOR
// to approximate driving distance. Coarse 3-tier pricing does not need
// turn-by-turn accuracy.

export const TTT_SESSION_BASE = 750;
export const TTT_TIER2_MAX_MILES = 50;   // <=50 mi -> $750
export const TTT_TIER3_MAX_MILES = 100;  // 51-100 mi -> $800, 100+ -> $850
export const TTT_TIER2_PRICE = 800;
export const TTT_TIER3_PRICE = 850;
export const TTT_TRAVEL_WAIVE_MIN_PARTICIPANTS = 3;

// Straight-line miles are scaled to approximate road miles.
const ROAD_FACTOR = 1.2;

export type TttTier = 1 | 2 | 3;

export interface TttQuote {
  miles: number | null;        // null when the site ZIP is unknown/unresolvable
  tier: TttTier;
  sessionPrice: number;        // final flat session charge
  travelFee: number;           // surcharge over base (0 when waived/tier 1)
  travelWaived: boolean;       // true when 3+ participants zeroed the travel fee
  resolved: boolean;           // false when distance could not be determined
}

// Origin: Miramar HQ (8760 Miramar Place, San Diego, CA 92121). On-site/TTT
// always dispatches from San Diego regardless of which location page the
// customer entered through.
const ORIGIN = { lat: 32.8938, lon: -117.1726 }; // 92121

// Bundled ZIP3 (first-3-digit) -> representative lat/long. Covers the service
// footprint (Southern CA, Las Vegas NV metro, Central Valley CA) plus national
// fallbacks. Resolution to ZIP3 is intentional: tier boundaries are 50 miles
// wide, so prefix-level precision is sufficient and keeps the table small.
// Sources: USPS ZIP3 centroid approximations.
const ZIP3_LATLON: Record<string, [number, number]> = {
  // San Diego metro (919-922)
  "919": [32.68, -117.05], "920": [33.12, -117.20], "921": [32.79, -117.10], "922": [33.40, -116.30],
  // Orange / Riverside / San Bernardino / LA basin (923-928, 900-908, 910-918)
  "923": [34.50, -117.00], "924": [34.10, -117.30], "925": [33.85, -117.20], "926": [33.62, -117.70],
  "927": [33.72, -117.85], "928": [33.87, -117.75], "900": [34.05, -118.25], "901": [34.05, -118.25],
  "902": [33.95, -118.35], "903": [33.95, -118.34], "904": [34.02, -118.49], "905": [33.84, -118.34],
  "906": [33.90, -118.07], "907": [33.83, -118.16], "908": [33.79, -118.16], "910": [34.17, -118.13],
  "911": [34.16, -118.14], "912": [34.15, -118.26], "913": [34.23, -118.60], "914": [34.18, -118.45],
  "915": [34.19, -118.33], "916": [34.16, -118.38], "917": [34.07, -117.90], "918": [34.07, -118.12],
  // Imperial / Eastern (922 covered), Kern/Bakersfield (932-933), Central Coast (930-931, 934)
  "930": [34.22, -119.18], "931": [34.43, -119.72], "932": [35.60, -119.40], "933": [35.37, -119.02],
  "934": [35.10, -120.50], "935": [34.90, -118.00],
  // Fresno / Central Valley (936-938, 953)
  "936": [36.60, -119.60], "937": [36.78, -119.78], "938": [36.75, -119.78], "953": [37.55, -121.00],
  // Las Vegas metro (889-891)
  "889": [36.10, -115.17], "890": [36.18, -115.14], "891": [36.13, -115.18],
  // Phoenix AZ (850-853) and Tucson (856-857) fallbacks for out-of-state quotes
  "850": [33.45, -112.07], "851": [33.45, -112.00], "852": [33.42, -111.83], "853": [33.52, -112.30],
  "856": [32.22, -110.97], "857": [32.22, -110.97],
};

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Resolve a 5-digit ZIP to approximate driving miles from Miramar HQ.
// Returns null when the ZIP prefix is not in the table.
export function milesFromMiramar(zip: string): number | null {
  const clean = (zip || "").trim();
  if (!/^\d{5}$/.test(clean)) return null;
  const prefix = clean.slice(0, 3);
  const coords = ZIP3_LATLON[prefix];
  if (!coords) return null;
  const straight = haversineMiles(ORIGIN.lat, ORIGIN.lon, coords[0], coords[1]);
  return Math.round(straight * ROAD_FACTOR);
}

// Core pricing rule. participantCount drives ONLY the travel-fee waiver; the
// session charge itself is flat regardless of headcount.
export function computeTttQuote(zip: string, participantCount: number): TttQuote {
  const miles = milesFromMiramar(zip);
  const resolved = miles !== null;

  // Tier by distance (default to tier 1 / base when distance is unknown so we
  // never overcharge on an unresolvable ZIP - the office confirms travel for
  // far sites manually).
  let tier: TttTier = 1;
  if (resolved && miles! > TTT_TIER3_MAX_MILES) tier = 3;
  else if (resolved && miles! > TTT_TIER2_MAX_MILES) tier = 2;

  const travelFeeByTier = tier === 3 ? TTT_TIER3_PRICE - TTT_SESSION_BASE
    : tier === 2 ? TTT_TIER2_PRICE - TTT_SESSION_BASE
    : 0;

  const travelWaived = participantCount >= TTT_TRAVEL_WAIVE_MIN_PARTICIPANTS && travelFeeByTier > 0;
  const travelFee = travelWaived ? 0 : travelFeeByTier;
  const sessionPrice = TTT_SESSION_BASE + travelFee;

  return { miles, tier, sessionPrice, travelFee, travelWaived, resolved };
}
