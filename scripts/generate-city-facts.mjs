// Generates client/src/data/serviceAreaCityFacts.ts — compact per-city facts
// for the programmatic service-area SEO pages. Full page content (EN + ES) is
// expanded at runtime from these facts by client/src/data/serviceAreaGenerator.ts,
// which keeps the JS bundle small (~facts only, prose templates included once).
//
// Usage: node scripts/generate-city-facts.mjs
//
// Seed format per city:
//   [name, county, population, zipPrefixes, landmark, industryTags, tier, driveMinutes, opts?]
// opts: { slug?, region?, kind?: "district", parent?: string }
//
// tier — drive-time bucket to the nearest Miramar facility, drives the CTA:
//   "facility" ≤30 min → book at the facility (/book-training)
//   "nearby"   30–60   → onsite training (/request-quote)
//   "onsite"   60+     → onsite training, wider-area messaging (/request-quote)
//
// Hand-written pages (los-angeles, bakersfield, hayward) are intentionally NOT
// seeded here — they live in serviceAreas.ts and always win on slug conflicts.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../client/src/data/serviceAreaCityFacts.ts");

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ─── Southern California — San Diego County (facility: San Diego) ─────────
const SD_COUNTY = [
  ["San Diego", "San Diego County", 1386000, ["921", "920", "919"], "the Port of San Diego", ["portLogistics", "defense", "biotech", "warehousing", "construction"], "facility", 15],
  ["Chula Vista", "San Diego County", 275000, ["919"], "the Chula Vista Bayfront", ["warehousing", "construction", "manufacturing", "logistics"], "facility", 25],
  ["Oceanside", "San Diego County", 172000, ["920"], "Oceanside Harbor", ["manufacturing", "construction", "logistics", "defense"], "nearby", 40],
  ["Escondido", "San Diego County", 151000, ["920"], "the North County industrial corridor", ["manufacturing", "construction", "agriculture", "warehousing"], "facility", 30],
  ["Carlsbad", "San Diego County", 115000, ["920"], "the Palomar Airport business park", ["biotech", "manufacturing", "ecommerce", "warehousing"], "facility", 30],
  ["El Cajon", "San Diego County", 106000, ["920", "919"], "Gillespie Field", ["manufacturing", "construction", "warehousing", "retail"], "facility", 25],
  ["Vista", "San Diego County", 98000, ["920"], "the Vista Business Park", ["manufacturing", "foodProcessing", "warehousing", "construction"], "nearby", 35],
  ["San Marcos", "San Diego County", 94000, ["920"], "Cal State San Marcos", ["manufacturing", "buildingMaterials", "warehousing", "construction"], "nearby", 35],
  ["National City", "San Diego County", 56000, ["919"], "the National City Marine Terminal", ["portLogistics", "warehousing", "logistics", "manufacturing"], "facility", 20],
  ["La Mesa", "San Diego County", 61000, ["919", "920"], "Grossmont Center", ["retail", "construction", "warehousing", "logistics"], "facility", 20],
  ["Spring Valley", "San Diego County", 60000, ["919"], "the Sweetwater Reservoir area", ["construction", "warehousing", "retail", "logistics"], "facility", 25],
  ["Lemon Grove", "San Diego County", 27000, ["919"], "the Lemon Grove trolley depot", ["warehousing", "construction", "manufacturing", "logistics"], "facility", 22],
  ["Imperial Beach", "San Diego County", 26000, ["919"], "the Imperial Beach Pier", ["construction", "hospitality", "logistics", "warehousing"], "facility", 30],
  ["Santee", "San Diego County", 60000, ["920"], "Santee Trolley Square", ["construction", "manufacturing", "warehousing", "retail"], "facility", 25],
  ["Poway", "San Diego County", 48000, ["920"], "the Poway Business Park", ["manufacturing", "aerospace", "warehousing", "biotech"], "facility", 20],
  ["Encinitas", "San Diego County", 61000, ["920"], "Moonlight Beach", ["agriculture", "construction", "retail", "hospitality"], "facility", 25],
  ["Solana Beach", "San Diego County", 12000, ["920"], "the Cedros Design District", ["retail", "construction", "hospitality", "logistics"], "facility", 20],
  ["Cardiff", "San Diego County", 12000, ["920"], "Cardiff State Beach", ["construction", "retail", "hospitality", "agriculture"], "facility", 25, { kind: "district", parent: "Encinitas" }],
  ["La Jolla", "San Diego County", 46000, ["920"], "UC San Diego", ["biotech", "hospitality", "retail", "construction"], "facility", 15, { kind: "district", parent: "San Diego" }],
  ["Mira Mesa", "San Diego County", 74000, ["921"], "the Mira Mesa tech corridor", ["biotech", "manufacturing", "warehousing", "ecommerce"], "facility", 5, { kind: "district", parent: "San Diego" }],
  ["Kearny Mesa", "San Diego County", 22000, ["921"], "Montgomery Field", ["manufacturing", "logistics", "warehousing", "defense"], "facility", 10, { kind: "district", parent: "San Diego" }],
  ["Miramar", "San Diego County", 15000, ["921"], "MCAS Miramar", ["defense", "warehousing", "logistics", "manufacturing"], "facility", 5, { kind: "district", parent: "San Diego" }],
  ["Sorrento Valley", "San Diego County", 10000, ["921"], "the Sorrento Valley biotech cluster", ["biotech", "manufacturing", "ecommerce", "warehousing"], "facility", 10, { kind: "district", parent: "San Diego" }],
  ["Otay Mesa", "San Diego County", 20000, ["921", "919"], "the Otay Mesa Port of Entry", ["logistics", "warehousing", "manufacturing", "portLogistics"], "facility", 30, { kind: "district", parent: "San Diego" }],
  ["San Ysidro", "San Diego County", 28000, ["921"], "the San Ysidro border crossing", ["logistics", "warehousing", "retail", "construction"], "facility", 30, { kind: "district", parent: "San Diego" }],
  ["Rancho Bernardo", "San Diego County", 50000, ["921"], "the Rancho Bernardo tech campuses", ["manufacturing", "biotech", "warehousing", "ecommerce"], "facility", 18, { kind: "district", parent: "San Diego" }],
  ["Carmel Valley", "San Diego County", 45000, ["921"], "the Del Mar Heights corridor", ["biotech", "retail", "construction", "hospitality"], "facility", 12, { kind: "district", parent: "San Diego" }],
  ["Del Mar", "San Diego County", 4000, ["920"], "the Del Mar Fairgrounds", ["hospitality", "retail", "construction", "logistics"], "facility", 15],
];

// ─── Southern California — Riverside County (SD onsite range) ──────────────
const SW_RIVERSIDE = [
  ["Temecula", "Riverside County", 110000, ["925"], "Temecula Wine Country", ["warehousing", "manufacturing", "logistics", "construction"], "nearby", 55, { region: "Southwest Riverside County" }],
  ["Murrieta", "Riverside County", 118000, ["925"], "the Golden Triangle", ["logistics", "construction", "warehousing", "retail"], "nearby", 60, { region: "Southwest Riverside County" }],
];

// ─── Southern California — LA / OC / IE / Ventura (onsite from San Diego) ──
const LA_METRO = [
  // Los Angeles County ("Greater Los Angeles")
  ["Long Beach", "Los Angeles County", 466000, ["908", "907"], "the Port of Long Beach", ["portLogistics", "logistics", "manufacturing", "warehousing"], "onsite", 105, { region: "Greater Los Angeles" }],
  ["Torrance", "Los Angeles County", 147000, ["905"], "the Torrance refinery corridor", ["manufacturing", "aerospace", "logistics", "warehousing"], "onsite", 110, { region: "Greater Los Angeles" }],
  ["Compton", "Los Angeles County", 95000, ["902"], "the Compton rail yards", ["warehousing", "logistics", "manufacturing", "foodProcessing"], "onsite", 105, { region: "Greater Los Angeles" }],
  ["Inglewood", "Los Angeles County", 108000, ["903"], "SoFi Stadium", ["logistics", "construction", "warehousing", "hospitality"], "onsite", 115, { region: "Greater Los Angeles" }],
  ["Downey", "Los Angeles County", 114000, ["902"], "the Downey industrial corridor", ["manufacturing", "warehousing", "foodProcessing", "logistics"], "onsite", 100, { region: "Greater Los Angeles" }],
  ["Norwalk", "Los Angeles County", 103000, ["906"], "the Santa Fe Springs industrial belt", ["warehousing", "logistics", "manufacturing", "construction"], "onsite", 95, { region: "Greater Los Angeles" }],
  ["Whittier", "Los Angeles County", 87000, ["906"], "the Whittier Boulevard corridor", ["warehousing", "construction", "foodProcessing", "retail"], "onsite", 100, { region: "Greater Los Angeles" }],
  ["Pomona", "Los Angeles County", 151000, ["917"], "the Fairplex", ["warehousing", "logistics", "manufacturing", "agriculture"], "onsite", 105, { region: "Greater Los Angeles" }],
  ["Pasadena", "Los Angeles County", 138000, ["911"], "the Rose Bowl", ["construction", "biotech", "retail", "logistics"], "onsite", 120, { region: "Greater Los Angeles" }],
  ["Glendale", "Los Angeles County", 197000, ["912"], "the Grand Central Creative Campus", ["manufacturing", "retail", "construction", "logistics"], "onsite", 120, { region: "Greater Los Angeles" }],
  ["Burbank", "Los Angeles County", 107000, ["915"], "Hollywood Burbank Airport", ["logistics", "manufacturing", "hospitality", "warehousing"], "onsite", 125, { region: "Greater Los Angeles" }],
  ["Santa Clarita", "Los Angeles County", 228000, ["913"], "the Valencia Industrial Center", ["warehousing", "manufacturing", "logistics", "construction"], "onsite", 140, { region: "Greater Los Angeles" }],
  ["El Monte", "Los Angeles County", 109000, ["917"], "the El Monte industrial district", ["manufacturing", "warehousing", "foodProcessing", "logistics"], "onsite", 110, { region: "Greater Los Angeles" }],
  ["West Covina", "Los Angeles County", 109000, ["917"], "the West Covina retail corridor", ["retail", "warehousing", "construction", "logistics"], "onsite", 105, { region: "Greater Los Angeles" }],
  ["Carson", "Los Angeles County", 95000, ["907"], "the Carson port and refinery corridor", ["portLogistics", "warehousing", "logistics", "energy"], "onsite", 105, { region: "Greater Los Angeles" }],
  ["Santa Fe Springs", "Los Angeles County", 19000, ["906"], "the Santa Fe Springs industrial district", ["warehousing", "manufacturing", "logistics", "foodProcessing"], "onsite", 100, { region: "Greater Los Angeles" }],
  ["Vernon", "Los Angeles County", 3000, ["900"], "the Vernon industrial district", ["foodProcessing", "coldStorage", "warehousing", "manufacturing"], "onsite", 110, { region: "Greater Los Angeles" }],
  ["City of Industry", "Los Angeles County", 4000, ["917"], "the City of Industry rail hub", ["warehousing", "logistics", "manufacturing", "ecommerce"], "onsite", 105, { region: "Greater Los Angeles" }],
  ["Cerritos", "Los Angeles County", 49000, ["907"], "the Cerritos Auto Square", ["warehousing", "retail", "logistics", "manufacturing"], "onsite", 95, { region: "Greater Los Angeles" }],
  ["Lancaster", "Los Angeles County", 173000, ["935"], "the Lancaster aerospace corridor", ["aerospace", "defense", "energy", "warehousing"], "onsite", 165, { region: "Antelope Valley" }],
  ["Palmdale", "Los Angeles County", 169000, ["935"], "Air Force Plant 42", ["aerospace", "defense", "manufacturing", "logistics"], "onsite", 160, { region: "Antelope Valley" }],
  // Orange County
  ["Anaheim", "Orange County", 346000, ["928"], "Angel Stadium", ["hospitality", "manufacturing", "warehousing", "construction"], "onsite", 95, { region: "Orange County" }],
  ["Irvine", "Orange County", 314000, ["926"], "the Irvine Spectrum", ["biotech", "manufacturing", "ecommerce", "warehousing"], "onsite", 80, { region: "Orange County" }],
  ["Santa Ana", "Orange County", 310000, ["927"], "downtown Santa Ana", ["manufacturing", "warehousing", "construction", "foodProcessing"], "onsite", 90, { region: "Orange County" }],
  ["Huntington Beach", "Orange County", 197000, ["926"], "the Huntington Beach Pier", ["aerospace", "manufacturing", "construction", "hospitality"], "onsite", 95, { region: "Orange County" }],
  ["Garden Grove", "Orange County", 171000, ["928"], "the Garden Grove industrial corridor", ["manufacturing", "warehousing", "logistics", "construction"], "onsite", 95, { region: "Orange County" }],
  ["Costa Mesa", "Orange County", 111000, ["926"], "South Coast Plaza", ["retail", "manufacturing", "construction", "logistics"], "onsite", 85, { region: "Orange County" }],
  ["Mission Viejo", "Orange County", 93000, ["926"], "the Saddleback Valley", ["retail", "construction", "logistics", "warehousing"], "onsite", 70, { region: "Orange County" }],
  ["Fullerton", "Orange County", 143000, ["928"], "the Fullerton Transportation Center", ["manufacturing", "foodProcessing", "warehousing", "logistics"], "onsite", 95, { region: "Orange County" }],
  ["Orange", "Orange County", 139000, ["928"], "the Orange Plaza Historic District", ["manufacturing", "construction", "warehousing", "retail"], "onsite", 90, { region: "Orange County" }],
  ["Tustin", "Orange County", 80000, ["927"], "the Tustin Legacy hangars", ["logistics", "warehousing", "construction", "manufacturing"], "onsite", 85, { region: "Orange County" }],
  ["Buena Park", "Orange County", 84000, ["906"], "Knott's Berry Farm", ["foodProcessing", "warehousing", "manufacturing", "hospitality"], "onsite", 95, { region: "Orange County" }],
  // Inland Empire
  ["Ontario", "San Bernardino County", 175000, ["917"], "Ontario International Airport", ["warehousing", "logistics", "ecommerce", "manufacturing"], "onsite", 100, { region: "Inland Empire" }],
  ["Rancho Cucamonga", "San Bernardino County", 174000, ["917"], "the Rancho Cucamonga logistics corridor", ["warehousing", "ecommerce", "logistics", "manufacturing"], "onsite", 105, { region: "Inland Empire" }],
  ["Fontana", "San Bernardino County", 208000, ["923"], "the Fontana trucking corridor", ["warehousing", "logistics", "manufacturing", "construction"], "onsite", 100, { region: "Inland Empire" }],
  ["San Bernardino", "San Bernardino County", 222000, ["924"], "the San Bernardino rail yards", ["warehousing", "logistics", "manufacturing", "construction"], "onsite", 105, { region: "Inland Empire" }],
  ["Chino", "San Bernardino County", 91000, ["917"], "the Chino Airport industrial area", ["warehousing", "foodProcessing", "manufacturing", "logistics"], "onsite", 95, { region: "Inland Empire" }],
  ["Corona", "Riverside County", 157000, ["928"], "the Corona industrial corridor", ["manufacturing", "warehousing", "logistics", "construction"], "onsite", 85, { region: "Inland Empire" }],
  ["Riverside", "Riverside County", 314000, ["925"], "the Hunter Park industrial district", ["warehousing", "logistics", "manufacturing", "agriculture"], "onsite", 90, { region: "Inland Empire" }],
  ["Moreno Valley", "Riverside County", 208000, ["925"], "the World Logistics Center corridor", ["warehousing", "ecommerce", "logistics", "construction"], "onsite", 85, { region: "Inland Empire" }],
  // Ventura County
  ["Oxnard", "Ventura County", 202000, ["930"], "the Port of Hueneme", ["portLogistics", "agriculture", "foodProcessing", "warehousing"], "onsite", 175, { region: "Ventura County" }],
  ["Ventura", "Ventura County", 110000, ["930"], "Ventura Harbor", ["agriculture", "energy", "construction", "manufacturing"], "onsite", 170, { region: "Ventura County" }],
  ["Thousand Oaks", "Ventura County", 126000, ["913"], "the Conejo Valley biotech corridor", ["biotech", "manufacturing", "warehousing", "retail"], "onsite", 155, { region: "Ventura County" }],
  ["Simi Valley", "Ventura County", 126000, ["930"], "the Ronald Reagan Presidential Library", ["manufacturing", "warehousing", "construction", "logistics"], "onsite", 160, { region: "Ventura County" }],
];

// ─── Central California (facility: Fresno) ────────────────────────────────
const CENTRAL = [
  ["Fresno", "Fresno County", 545000, ["937", "936"], "the downtown Fresno rail corridor", ["agriculture", "foodProcessing", "warehousing", "logistics", "coldStorage"], "facility", 12],
  ["Clovis", "Fresno County", 124000, ["936"], "Old Town Clovis", ["construction", "manufacturing", "agriculture", "retail"], "facility", 15],
  ["Madera", "Madera County", 67000, ["936"], "the Madera wine trail", ["agriculture", "foodProcessing", "manufacturing", "logistics"], "facility", 30],
  ["Merced", "Merced County", 90000, ["953"], "UC Merced", ["agriculture", "foodProcessing", "warehousing", "logistics"], "nearby", 55],
  ["Visalia", "Tulare County", 142000, ["932"], "the Visalia Industrial Park", ["agriculture", "coldStorage", "warehousing", "logistics"], "nearby", 45],
  ["Tulare", "Tulare County", 70000, ["932"], "the World Ag Expo grounds", ["agriculture", "foodProcessing", "coldStorage", "manufacturing"], "nearby", 55],
  ["Porterville", "Tulare County", 62000, ["932"], "the Porterville citrus belt", ["agriculture", "foodProcessing", "warehousing", "construction"], "onsite", 70],
  ["Hanford", "Kings County", 58000, ["932"], "downtown Hanford", ["agriculture", "foodProcessing", "manufacturing", "logistics"], "nearby", 40],
  ["Delano", "Kern County", 52000, ["932"], "the Delano table-grape packing district", ["agriculture", "coldStorage", "foodProcessing", "logistics"], "onsite", 75],
  ["Selma", "Fresno County", 25000, ["936"], "the Raisin Capital of the World", ["agriculture", "foodProcessing", "warehousing", "manufacturing"], "facility", 25],
  ["Kingsburg", "Fresno County", 13000, ["936"], "the Kingsburg Swedish Village", ["agriculture", "foodProcessing", "manufacturing", "logistics"], "facility", 30],
  ["Reedley", "Fresno County", 26000, ["936"], "the Reedley fruit-packing district", ["agriculture", "foodProcessing", "coldStorage", "warehousing"], "nearby", 35],
  ["Sanger", "Fresno County", 27000, ["936"], "the Sanger depot district", ["agriculture", "foodProcessing", "warehousing", "manufacturing"], "facility", 25],
  ["Lemoore", "Kings County", 27000, ["932"], "NAS Lemoore", ["defense", "agriculture", "foodProcessing", "logistics"], "nearby", 50],
  ["Exeter", "Tulare County", 10000, ["932"], "the Exeter citrus murals", ["agriculture", "foodProcessing", "warehousing", "construction"], "nearby", 55],
];

// ─── Southern Nevada (facility: Las Vegas) ────────────────────────────────
const NEVADA = [
  ["Las Vegas", "Clark County", 660000, ["891", "890"], "the Las Vegas Strip", ["hospitality", "warehousing", "construction", "logistics", "ecommerce"], "facility", 15],
  ["Henderson", "Clark County", 330000, ["890"], "the Henderson Executive Airport industrial area", ["manufacturing", "warehousing", "logistics", "construction"], "facility", 25],
  ["North Las Vegas", "Clark County", 280000, ["890"], "the Apex Industrial Park", ["warehousing", "ecommerce", "logistics", "manufacturing"], "facility", 20],
  ["Boulder City", "Clark County", 15000, ["890"], "the Hoover Dam", ["energy", "construction", "hospitality", "logistics"], "nearby", 35],
  ["Mesquite", "Clark County", 22000, ["890"], "the Mesquite resort corridor", ["hospitality", "construction", "warehousing", "logistics"], "onsite", 80],
  ["Pahrump", "Nye County", 45000, ["890"], "the Pahrump Valley wineries", ["construction", "agriculture", "retail", "logistics"], "onsite", 65],
  ["Spring Valley", "Clark County", 220000, ["891"], "Desert Breeze Park", ["retail", "hospitality", "construction", "warehousing"], "facility", 10, { slug: "spring-valley-nv", kind: "district", parent: "Las Vegas" }],
  ["Summerlin", "Clark County", 120000, ["891"], "Downtown Summerlin", ["construction", "retail", "hospitality", "logistics"], "facility", 25, { kind: "district", parent: "Las Vegas" }],
  ["Enterprise", "Clark County", 230000, ["891"], "the south Las Vegas Boulevard corridor", ["warehousing", "logistics", "ecommerce", "construction"], "facility", 10, { kind: "district", parent: "Las Vegas" }],
  ["Sunrise Manor", "Clark County", 205000, ["891"], "the Nellis Boulevard corridor", ["construction", "warehousing", "retail", "logistics"], "facility", 25, { kind: "district", parent: "Las Vegas" }],
  ["Paradise", "Clark County", 190000, ["891"], "Harry Reid International Airport", ["hospitality", "logistics", "warehousing", "construction"], "facility", 10, { kind: "district", parent: "Las Vegas" }],
  ["Winchester", "Clark County", 36000, ["891"], "the Las Vegas Convention Center", ["hospitality", "construction", "logistics", "retail"], "facility", 15, { kind: "district", parent: "Las Vegas" }],
  ["Whitney", "Clark County", 46000, ["891"], "the Boulder Highway corridor", ["construction", "warehousing", "retail", "logistics"], "facility", 20, { kind: "district", parent: "Las Vegas" }],
  ["Nellis AFB Area", "Clark County", 3000, ["891"], "Nellis Air Force Base", ["defense", "logistics", "construction", "warehousing"], "facility", 25, { slug: "nellis-afb", kind: "district", parent: "Las Vegas" }],
];

const GROUPS = [
  { rows: [...SD_COUNTY, ...SW_RIVERSIDE, ...LA_METRO], regionGroup: "southern-california", facility: "san-diego", state: "California", stateAbbrev: "CA" },
  { rows: CENTRAL, regionGroup: "central-california", facility: "fresno", state: "California", stateAbbrev: "CA" },
  { rows: NEVADA, regionGroup: "southern-nevada", facility: "las-vegas", state: "Nevada", stateAbbrev: "NV" },
];

const DEFAULT_REGION = {
  "San Diego County": "San Diego County",
  "Riverside County": "Inland Empire",
  "Fresno County": "Central Valley",
  "Madera County": "Central Valley",
  "Merced County": "Central Valley",
  "Tulare County": "Central Valley",
  "Kings County": "Central Valley",
  "Kern County": "Central Valley",
  "Clark County": "Las Vegas Valley",
  "Nye County": "Las Vegas Valley",
};

const cities = [];
const seenSlugs = new Set(["los-angeles", "bakersfield", "hayward"]); // hand-written, reserved

for (const group of GROUPS) {
  for (const row of group.rows) {
    const [name, county, population, zipPrefixes, landmark, industries, tier, driveMinutes, opts = {}] = row;
    const slug = opts.slug || slugify(name);
    if (seenSlugs.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
    seenSlugs.add(slug);
    cities.push({
      slug,
      name,
      kind: opts.kind || "city",
      ...(opts.parent ? { parentCity: opts.parent } : {}),
      state: group.state,
      stateAbbrev: group.stateAbbrev,
      county,
      region: opts.region || DEFAULT_REGION[county] || county,
      regionGroup: group.regionGroup,
      population,
      zipPrefixes,
      landmark,
      industries,
      tier,
      facility: group.facility,
      driveMinutes,
    });
  }
}

// Nearby areas: other cities in the same county (largest first), padded with
// same-region-group cities when a county is sparse. Cap 10.
for (const city of cities) {
  const sameCounty = cities
    .filter((c) => c.county === city.county && c.slug !== city.slug)
    .sort((a, b) => b.population - a.population)
    .map((c) => c.name);
  const sameRegion = cities
    .filter((c) => c.regionGroup === city.regionGroup && c.county !== city.county && c.slug !== city.slug)
    .sort((a, b) => b.population - a.population)
    .map((c) => c.name);
  city.nearby = [...sameCounty, ...sameRegion].slice(0, 10);
}

const header = `// AUTO-GENERATED by scripts/generate-city-facts.mjs — do not edit by hand.
// Re-run \`node scripts/generate-city-facts.mjs\` after editing the seed data.
// Compact per-city facts; full page content is expanded at runtime by
// client/src/data/serviceAreaGenerator.ts.

export type CityTier = "facility" | "nearby" | "onsite";
export type FacilitySlug = "san-diego" | "las-vegas" | "fresno";
export type RegionGroup = "southern-california" | "central-california" | "southern-nevada";

export interface CityFacts {
  slug: string;
  name: string;
  kind: "city" | "district";
  parentCity?: string;
  state: string;
  stateAbbrev: string;
  county: string;
  region: string;
  regionGroup: RegionGroup;
  population: number;
  zipPrefixes: string[];
  landmark: string;
  industries: string[];
  nearby: string[];
  tier: CityTier;
  facility: FacilitySlug;
  driveMinutes: number;
}

export const CITY_FACTS: CityFacts[] = `;

writeFileSync(
  OUT,
  header + JSON.stringify(cities, null, 2) + `;

export const GENERATED_CITY_SLUGS: string[] = CITY_FACTS.map((c) => c.slug);
`,
);

console.log(`Wrote ${cities.length} cities to ${OUT}`);
const tiers = cities.reduce((acc, c) => ((acc[c.tier] = (acc[c.tier] || 0) + 1), acc), {});
console.log("Tiers:", tiers);
console.log(
  "Groups:",
  cities.reduce((acc, c) => ((acc[c.regionGroup] = (acc[c.regionGroup] || 0) + 1), acc), {}),
);
