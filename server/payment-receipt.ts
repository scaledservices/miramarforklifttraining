/**
 * What the Authorize.net merchant receipt should say about a charge
 * (Alberto 2026-10-30: receipts showed an approved amount and nothing else).
 * Builds ReceiptDetails for createTransactionFromNonce from data each charge
 * flow already has. Purely descriptive: never changes the amount charged.
 */
import { storage } from "./storage";
import type { ReceiptDetails, ReceiptLineItem } from "./authorizeNetClient";

const UPPER = new Set(["epj", "osha", "lpg", "sd", "lv", "id", "ttt"]);

/** "forklift-scissor-lift-epj-certification-san-diego" -> "Forklift Scissor Lift EPJ Certification San Diego" */
export function humanizeSlug(slug: string): string {
  return String(slug || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => (UPPER.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/** "2026-11-02" + "09:00" -> "Nov 2, 2026 9:00 AM" (no timezone math: both are local wall-clock values). */
export function formatSession(date?: string | null, time?: string | null): string {
  if (!date) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let out = `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
  const t = /^(\d{1,2}):(\d{2})/.exec(time || "");
  if (t) {
    const h = Number(t[1]);
    out += ` ${((h + 11) % 12) + 1}:${t[2]} ${h < 12 ? "AM" : "PM"}`;
  }
  return out;
}

export function surchargeLine(surcharge: number): ReceiptLineItem[] {
  return surcharge > 0 ? [{ itemId: "card-fee", name: "Card processing fee", quantity: 1, unitPrice: surcharge }] : [];
}

/**
 * Who paid: the signed-in buyer, with an optional contact override (bookings
 * carry the contact typed at checkout) and the order's company if any.
 */
export async function receiptCustomer(
  userId: number | null | undefined,
  opts: { companyId?: number | null; contact?: { name?: string | null; email?: string | null; phone?: string | null; company?: string | null } } = {}
): Promise<ReceiptDetails["customer"]> {
  let user: any = null;
  try { if (userId) user = await storage.getUser(userId); } catch { /* receipt detail is best-effort */ }
  let company: string | null = opts.contact?.company || null;
  if (!company && opts.companyId) {
    try { company = (await storage.getCompany(opts.companyId))?.name ?? null; } catch { /* best-effort */ }
  }
  return {
    name: opts.contact?.name || user?.name || null,
    email: opts.contact?.email || user?.email || null,
    phone: opts.contact?.phone || user?.phone || null,
    company,
  };
}

/** The zip the customer typed into the card form (non-sensitive), if valid. */
export function billingZipFrom(body: any): string | undefined {
  const z = String(body?.billingZip ?? "").trim();
  return /^\d{5}(-\d{4})?$/.test(z) ? z : undefined;
}
