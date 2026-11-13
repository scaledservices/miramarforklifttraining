import { db } from "./db";
import { and, eq, isNotNull } from "drizzle-orm";
import { companies, contacts, platformSettings } from "@shared/schema";

// ---------------------------------------------------------------------------
// New vs existing customer classification (decided 2026-10-26).
//
// A customer is EXISTING when they are on the legacy customer list that was
// imported from Miramar's previous systems (rows with an importBatchId):
//   - exact email match, or
//   - company email domain match, when the domain is NOT a generic mailbox
//     provider (gmail, yahoo, ...). Generic domains require an exact email.
// Everyone else is NEW. Classification is per customer, so every order from a
// new customer counts as new-customer revenue.
//
// An admin can override any single order. Overrides live in platform_settings
// (key below) so no schema change is needed: { [orderId]: "new" | "existing" }.
//
// The imported list is reference data for this lookup only. It is never the
// system of record for customers.
// ---------------------------------------------------------------------------

export type CustomerClass = "new" | "existing";
export type ClassificationSource = "legacy_email" | "legacy_domain" | "not_on_legacy_list" | "override" | "no_email";

export interface Classification {
  classification: CustomerClass;
  source: ClassificationSource;
}

export const ORDER_CLASSIFICATION_OVERRIDES_KEY = "order_customer_classification_overrides";

export const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com",
  "comcast.net", "att.net", "sbcglobal.net", "verizon.net", "cox.net", "charter.net",
  "earthlink.net", "protonmail.com", "proton.me", "gmx.com", "mail.com", "zoho.com",
  "yandex.com", "pacbell.net", "bellsouth.net", "juno.com", "netzero.net", "q.com",
  "hotmail.es", "yahoo.com.mx", "hotmail.com.mx", "outlook.es", "live.com.mx", "prodigy.net.mx",
]);

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export function emailDomain(email: string | null | undefined): string | null {
  const e = normalizeEmail(email);
  if (!e) return null;
  const d = e.split("@").pop()!.trim();
  return d || null;
}

export function isGenericDomain(domain: string | null): boolean {
  return !!domain && GENERIC_EMAIL_DOMAINS.has(domain);
}

export interface LegacyIndex {
  emails: Set<string>;
  domains: Set<string>;
}

/** Pure classifier so the rule is testable without a database. */
export function classifyEmail(email: string | null | undefined, index: LegacyIndex): Classification {
  const e = normalizeEmail(email);
  if (!e) return { classification: "new", source: "no_email" };
  if (index.emails.has(e)) return { classification: "existing", source: "legacy_email" };
  const d = emailDomain(e);
  if (d && !isGenericDomain(d) && index.domains.has(d)) {
    return { classification: "existing", source: "legacy_domain" };
  }
  return { classification: "new", source: "not_on_legacy_list" };
}

export function buildLegacyIndex(emails: Iterable<string | null | undefined>): LegacyIndex {
  const index: LegacyIndex = { emails: new Set(), domains: new Set() };
  for (const raw of emails) {
    const e = normalizeEmail(raw);
    if (!e) continue;
    index.emails.add(e);
    const d = emailDomain(e);
    if (d && !isGenericDomain(d)) index.domains.add(d);
  }
  return index;
}

export async function loadLegacyIndex(): Promise<LegacyIndex> {
  const contactRows = await db
    .select({ email: contacts.email })
    .from(contacts)
    .where(and(isNotNull(contacts.importBatchId), isNotNull(contacts.email)));
  const companyRows = await db
    .select({ email: companies.email })
    .from(companies)
    .where(and(isNotNull(companies.importBatchId), isNotNull(companies.email)));
  return buildLegacyIndex([...contactRows.map(r => r.email), ...companyRows.map(r => r.email)]);
}

export async function loadOrderOverrides(): Promise<Record<string, CustomerClass>> {
  const rows = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, ORDER_CLASSIFICATION_OVERRIDES_KEY));
  const value = (rows[0]?.value ?? {}) as Record<string, unknown>;
  const out: Record<string, CustomerClass> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === "new" || v === "existing") out[k] = v;
  }
  return out;
}

/** Set (or clear with null) the override for one order. */
export async function setOrderOverride(orderId: number, value: CustomerClass | null, userId: number | null): Promise<Record<string, CustomerClass>> {
  const current = await loadOrderOverrides();
  if (value === null) delete current[String(orderId)];
  else current[String(orderId)] = value;
  await db
    .insert(platformSettings)
    .values({ key: ORDER_CLASSIFICATION_OVERRIDES_KEY, value: current, updatedByUserId: userId })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: current, updatedAt: new Date(), updatedByUserId: userId },
    });
  return current;
}

export function classifyOrder(
  orderId: number,
  email: string | null | undefined,
  index: LegacyIndex,
  overrides: Record<string, CustomerClass>,
): Classification {
  const o = overrides[String(orderId)];
  if (o) return { classification: o, source: "override" };
  return classifyEmail(email, index);
}
