import type { AvailabilityRules } from "@shared/schema";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Monday-first ordering for day pickers and summaries. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DEFAULT_RULES: AvailabilityRules = {
  daysOfWeek: [1, 3, 5],
  timeSlots: [
    { startTime: "09:00", endTime: "12:00" },
    { startTime: "13:00", endTime: "16:00" },
  ],
  maxParticipants: 10,
  leadTimeDays: 2,
  windowDays: 90,
  blackoutDates: [],
};

export interface ScheduleTemplate {
  id: string;
  label: string;
  daysOfWeek: number[];
  timeSlots: { startTime: string; endTime: string }[];
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: "weekdays-8-5",
    label: "Weekdays 8–5",
    daysOfWeek: [1, 2, 3, 4, 5],
    timeSlots: [
      { startTime: "08:00", endTime: "12:00" },
      { startTime: "13:00", endTime: "17:00" },
    ],
  },
  {
    id: "weekdays-sat-morning",
    label: "Weekdays + Sat morning",
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    timeSlots: [
      { startTime: "08:00", endTime: "12:00" },
      { startTime: "13:00", endTime: "17:00" },
    ],
  },
  {
    id: "mon-wed-fri",
    label: "Mon/Wed/Fri",
    daysOfWeek: [1, 3, 5],
    timeSlots: [
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "13:00", endTime: "16:00" },
    ],
  },
];

/** Format a local Date as "YYYY-MM-DD" (no UTC shift). */
export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "13:00" → "1:00" (or "1:00 PM" when withPeriod is true). */
export function formatTime(time: string, withPeriod = false): string {
  const [hStr, m = "00"] = time.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return withPeriod ? `${h}:${m} ${period}` : `${h}:${m}`;
}

/** "Mon, Wed, Fri", "Mon–Fri", or "Every day". */
export function summarizeDays(days: number[]): string {
  if (days.length === 0) return "No days selected";
  if (days.length === 7) return "Every day";
  const sorted = DAY_ORDER.filter((d) => days.includes(d));
  const weekdays = [1, 2, 3, 4, 5];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return "Mon–Fri";
  return sorted.map((d) => DAY_LABELS[d]).join(", ");
}

export function summarizeSlots(rules: AvailabilityRules): string {
  return rules.timeSlots.map((s) => `${formatTime(s.startTime)}–${formatTime(s.endTime)}`).join(", ");
}

export function leadTimeText(days: number): string {
  if (days <= 0) return "same-day booking OK";
  return `book ${days}+ day${days === 1 ? "" : "s"} ahead`;
}

/**
 * Compute the next `count` bookable dates from today given draft rules —
 * respects daysOfWeek, leadTimeDays, windowDays, and blackoutDates.
 */
export function computeBookableDates(rules: AvailabilityRules, count = 8): string[] {
  const dates: string[] = [];
  if (rules.daysOfWeek.length === 0 || rules.timeSlots.length === 0) return dates;
  const blackouts = new Set(rules.blackoutDates || []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = Math.max(0, rules.leadTimeDays);
  for (let i = start; i <= rules.windowDays && dates.length < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (!rules.daysOfWeek.includes(d.getDay())) continue;
    const iso = toISODate(d);
    if (blackouts.has(iso)) continue;
    dates.push(iso);
  }
  return dates;
}

export interface ZipParseResult {
  valid: string[];
  invalid: string[];
  /** How many 5-digit ZIP codes the entries can match (prefixes count as their span). */
  matchCount: number;
}

/** Parse free-form ZIP input (comma / space / newline separated) into unique 3–5 digit entries. */
export function parseZipInput(text: string): ZipParseResult {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    if (/^\d{3,5}$/.test(token)) {
      if (!valid.includes(token)) valid.push(token);
    } else if (!invalid.includes(token)) {
      invalid.push(token);
    }
  }
  const matchCount = valid.reduce((sum, z) => sum + Math.pow(10, 5 - z.length), 0);
  return { valid, invalid, matchCount };
}

/** Pull a human-readable message out of apiRequest's "STATUS: body" error strings. */
export function friendlyError(err: Error, fallback: string): string {
  const msg = err.message || "";
  const jsonStart = msg.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(msg.slice(jsonStart));
      if (parsed && typeof parsed.error === "string") return parsed.error;
      if (parsed && typeof parsed.message === "string") return parsed.message;
    } catch {
      // fall through
    }
  }
  const colonIdx = msg.indexOf(": ");
  if (colonIdx > 0 && colonIdx < 5) {
    const rest = msg.slice(colonIdx + 2).trim();
    if (rest) return rest;
  }
  return msg || fallback;
}
