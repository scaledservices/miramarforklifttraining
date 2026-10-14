/**
 * Conditional training days (meeting 2026-10-13, Peter: "prioritize Fresno").
 *
 * An area can offer extra days that only open when a PRIORITY area has no
 * bookings that date: San Diego Saturdays (9-1) open only when Fresno is empty,
 * because Alberto cannot be in both cities. The priority area always wins:
 * bookings on a conditional day never block or soft-hold the priority area.
 */
export interface ConditionalDays {
  daysOfWeek: number[];
  /** Slug of the area that has first claim on these days (e.g. "central-california"). */
  priorityAreaSlug: string;
  timeSlots: { startTime: string; endTime: string }[];
}

export interface AreaLike {
  id: number;
  slug: string;
  availabilityRules?: unknown;
}

export const weekdayOf = (dateStr: string): number => new Date(`${dateStr}T12:00:00`).getDay();

export function conditionalDaysOf(area: AreaLike | undefined): ConditionalDays | null {
  const c = (area?.availabilityRules as { conditionalDays?: ConditionalDays } | undefined)?.conditionalDays;
  if (!c || !Array.isArray(c.daysOfWeek) || !c.priorityAreaSlug || !Array.isArray(c.timeSlots)) return null;
  return c;
}

/** True when `area` is offering `dateStr` as a conditional (yield) day. */
export function isConditionalDate(area: AreaLike | undefined, dateStr: string): boolean {
  const c = conditionalDaysOf(area);
  return !!c && c.daysOfWeek.includes(weekdayOf(dateStr));
}

/**
 * Should a booking at `bookingArea` on `dateStr` be ignored when computing
 * trainer conflicts for `viewingAreaSlug`? Yes when the booking sits on a
 * conditional day that yields to the viewing (priority) area.
 */
export function yieldsTo(bookingArea: AreaLike | undefined, viewingAreaSlug: string | undefined, dateStr: string): boolean {
  const c = conditionalDaysOf(bookingArea);
  return !!c && !!viewingAreaSlug && c.priorityAreaSlug === viewingAreaSlug && c.daysOfWeek.includes(weekdayOf(dateStr));
}
