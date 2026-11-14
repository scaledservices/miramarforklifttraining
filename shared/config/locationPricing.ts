import { brand } from "./brand";
import type { TrainingLocation } from "./locations";

// Equipment keys used to decide which hands-on packages a location can sell.
// Derived from the location's equipmentTypes list in ./locations.ts, so that
// list stays the single source of truth (e.g. Las Vegas has no scissor or
// aerial equipment at the office, so packages needing them are hidden).
export type EquipmentKey = "counterbalance" | "reach" | "orderPicker" | "epj" | "scissor" | "aerial";

const EQUIPMENT_MATCHERS: [EquipmentKey, RegExp][] = [
  ["counterbalance", /counterbalance|sit-?down/i],
  ["reach", /reach/i],
  ["orderPicker", /order picker/i],
  ["epj", /pallet jack|\bepj\b/i],
  ["scissor", /scissor/i],
  ["aerial", /aerial|boom/i],
];

export function getLocationEquipmentKeys(loc: Pick<TrainingLocation, "equipmentTypes">): Set<EquipmentKey> {
  const keys = new Set<EquipmentKey>();
  for (const label of loc.equipmentTypes) {
    for (const [key, re] of EQUIPMENT_MATCHERS) if (re.test(label)) keys.add(key);
  }
  return keys;
}

export type InPersonPackageKey = keyof typeof brand.pricing.inPerson;

export interface LocationPricingPackage {
  key: InPersonPackageKey;
  name: string;
  price: number;
}

/** Hands-on packages a location can actually offer, in brand.pricing order. */
export function getLocationPricingPackages(loc: Pick<TrainingLocation, "equipmentTypes">): LocationPricingPackage[] {
  const have = getLocationEquipmentKeys(loc);
  return (Object.entries(brand.pricing.inPerson) as [InPersonPackageKey, (typeof brand.pricing.inPerson)[InPersonPackageKey]][])
    .filter(([, pkg]) => (pkg.requires as readonly EquipmentKey[]).every((k) => have.has(k)))
    .map(([key, pkg]) => ({ key, name: pkg.name, price: pkg.price }));
}
