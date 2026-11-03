/**
 * Billing address collected on every card payment (Peter + Alberto,
 * 2026-11-03): Authorize.net receipts and the office's order emails should
 * show the customer's address, as the old WooCommerce site did.
 */
export interface BillingAddressInput {
  address: string;
  city: string;
  state: string;
  zip: string;
}

export const EMPTY_BILLING: BillingAddressInput = { address: "", city: "", state: "", zip: "" };

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

/** Which fields are missing or invalid (empty list = OK). */
export function billingAddressProblems(b: Partial<BillingAddressInput> | null | undefined): Array<keyof BillingAddressInput> {
  const out: Array<keyof BillingAddressInput> = [];
  if (!b || String(b.address ?? "").trim().length < 3) out.push("address");
  if (!b || String(b.city ?? "").trim().length < 2) out.push("city");
  if (!b || !US_STATES.includes(String(b.state ?? "").trim().toUpperCase())) out.push("state");
  if (!b || !/^\d{5}$/.test(String(b.zip ?? "").trim())) out.push("zip");
  return out;
}

/** Clean, validated copy, or null if incomplete. */
export function normalizeBillingAddress(b: unknown): BillingAddressInput | null {
  const x = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
  const c = {
    address: String(x.address ?? "").trim().slice(0, 60),
    city: String(x.city ?? "").trim().slice(0, 40),
    state: String(x.state ?? "").trim().toUpperCase().slice(0, 2),
    zip: String(x.zip ?? "").trim().slice(0, 5),
  };
  return billingAddressProblems(c).length ? null : c;
}

export function formatBillingAddress(b: BillingAddressInput | null | undefined): string {
  if (!b) return "";
  return `${b.address}, ${b.city}, ${b.state} ${b.zip}`;
}
