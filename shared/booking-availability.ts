/**
 * Booking availability helpers (hands-on booking funnel, 2026-11-14).
 * Pure and DB-free so they can be unit-tested. Dates are "YYYY-MM-DD"
 * strings; weekdays are computed in UTC from the date parts so a browser
 * timezone can never shift a class day onto the previous/next weekday.
 */

export interface SlotLike {
  date: string;
  available: boolean;
}

/** Weekday (0 = Sunday ... 6 = Saturday) of a YYYY-MM-DD string, timezone-safe. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Local calendar date of `d` as YYYY-MM-DD (not UTC, which can be tomorrow). */
export function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** YYYY-MM-DD plus `days`, computed on date parts (DST-safe). */
export function addDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export interface ClassDaySummary {
  /** Distinct weekdays with at least one open slot, ordered Monday first. */
  weekdays: number[];
  /** Earliest open date on/after `today`, or null. */
  nextDate: string | null;
}

/** Summarize which weekdays a city holds classes and its next open date. */
export function summarizeClassDays(slots: SlotLike[] | null | undefined, today: string): ClassDaySummary {
  const days = new Set<number>();
  let nextDate: string | null = null;
  for (const s of Array.isArray(slots) ? slots : []) {
    if (!s || !s.available || typeof s.date !== "string" || s.date < today) continue;
    days.add(weekdayOf(s.date));
    if (nextDate === null || s.date < nextDate) nextDate = s.date;
  }
  const mondayFirst = (n: number) => (n + 6) % 7;
  return { weekdays: Array.from(days).sort((a, b) => mondayFirst(a) - mondayFirst(b)), nextDate };
}

/** Plural weekday name, e.g. "Mondays" (en) or "lunes" / "sábados" (es). */
export function pluralWeekday(weekday: number, lang: string): string {
  const es = lang?.startsWith("es");
  // 2024-01-07 was a Sunday; use UTC so the name matches the index.
  const name = new Date(Date.UTC(2024, 0, 7 + weekday)).toLocaleDateString(es ? "es-US" : "en-US", { weekday: "long", timeZone: "UTC" });
  if (es) return name.endsWith("s") ? name : `${name}s`;
  return `${name}s`;
}

/** "Mondays, Wednesdays and Fridays" / "lunes, miércoles y viernes". */
export function formatClassDays(weekdays: number[], lang: string): string {
  const es = lang?.startsWith("es");
  const names = weekdays.map((w) => pluralWeekday(w, lang));
  if (names.length <= 1) return names[0] ?? "";
  const joiner = es ? " y " : " and ";
  return `${names.slice(0, -1).join(", ")}${joiner}${names[names.length - 1]}`;
}

/** "Mon, Nov 16" style label for a YYYY-MM-DD date, timezone-safe. */
export function formatClassDate(dateStr: string, lang: string): string {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang?.startsWith("es") ? "es-US" : "en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

// ── "None of these dates work" lead (POST /api/onsite-requests) ──────────

export const LEAD_SOURCES = ["organic", "referral", "direct", "paid", "rep_sourced", "unknown"] as const;

export interface NoDateLeadInput {
  name: string;
  email: string;
  phone: string;
  preferredDates: string;
  people: number;
  city: string;
  facility: { slug: string; street: string; city: string; state: string; zip: string };
  programs: string[];
  leadSource?: string | null;
  locale?: string;
}

/** Field-level problems, same rules the /api/onsite-requests schema enforces. */
export function validateNoDateLead(input: Pick<NoDateLeadInput, "name" | "email" | "phone" | "people">, isValidEmail: (e: string) => boolean, isValidPhone: (p: string) => boolean): string[] {
  const errors: string[] = [];
  if (input.name.trim().length < 2) errors.push("name");
  if (!isValidEmail(input.email)) errors.push("email");
  if (input.phone.trim() !== "" && !isValidPhone(input.phone)) errors.push("phone");
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > 1000) errors.push("people");
  return errors;
}

/** Payload for the existing onsite/quote endpoint, marked as a hands-on class date request. */
export function buildNoDateLeadPayload(input: NoDateLeadInput) {
  const programs = input.programs.filter(Boolean);
  const notes = [
    `Hands-on class date request from the booking calendar: none of the offered dates worked.`,
    `City: ${input.city} (training center).`,
    programs.length ? `Program: ${programs.join(" + ")}.` : "",
    `Preferred date(s): ${input.preferredDates.trim() || "not specified"}.`,
    `People: ${input.people}.`,
  ].filter(Boolean).join("\n");
  const source = input.leadSource && (LEAD_SOURCES as readonly string[]).includes(input.leadSource) ? input.leadSource : "direct";
  return {
    contactName: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    trainingAddress: input.facility.street,
    city: input.facility.city,
    state: input.facility.state,
    zip: input.facility.zip,
    traineeCount: input.people,
    equipmentTypes: programs.length ? programs : ["Hands-on class"],
    trainingType: "Initial Certification",
    preferredDate1: input.preferredDates.trim() || undefined,
    notes,
    leadSource: source,
    requestedLocationSlug: input.facility.slug,
    requestedLocationType: "facility",
    locale: input.locale,
  };
}
