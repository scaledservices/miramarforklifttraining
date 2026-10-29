/**
 * Pure helpers for prefilling admin forms from an on-site training request
 * (a "lead"). Shared so they can be unit-tested without a DOM or database.
 */

/** Lead dates are stored as date-only text ("2026-10-31"). Parsing that with
 * `new Date()` reads it as UTC midnight, which shows as the previous day in
 * Pacific time. Keep the calendar date exactly as the customer chose it. */
export function dateOnlyToLocalInput(value: string | null | undefined, time = "08:00"): string {
  if (!value) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (m) {
    const hasTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value.trim());
    if (!hasTime) return `${m[1]}T${time}`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Same as above, date part only ("YYYY-MM-DD"), for date inputs. */
export function dateOnlyToLocalDate(value: string | null | undefined): string {
  return dateOnlyToLocalInput(value).slice(0, 10);
}

/** Public request forms use display labels ("Counterbalance Forklift");
 * the quote form uses equipment codes. Map by keyword, drop unknowns. */
export function mapLeadEquipment(list: string[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const raw of list ?? []) {
    const v = raw.toLowerCase();
    if (v.includes("stand")) out.add("stand_up_counterbalance");
    else if (v.includes("counterbal") || v.includes("sit")) out.add("sit_down_counterbalance");
    else if (v.includes("reach")) out.add("reach_truck");
    else if (v.includes("picker")) out.add("order_picker");
    else if (v.includes("pallet")) out.add("pallet_jack");
    else if (v.includes("scissor")) out.add("scissor_lift");
    else if (v.includes("boom") || v.includes("aerial")) out.add("boom_lift");
  }
  return Array.from(out);
}

export interface LeadForPrefill {
  id?: number | string | null;
  companyName?: string | null;
  contactName?: string | null;
  trainingAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  traineeCount?: number | null;
  equipmentTypes?: string[] | null;
  trainingType?: string | null;
  notes?: string | null;
  requestedLocationSlug?: string | null;
  requestedLocationType?: string | null;
  companyId?: number | null;
  contactId?: number | null;
  preferredDate1?: string | null;
  preferredDate2?: string | null;
  preferredDate3?: string | null;
}

/** Values for the New Quote form, built from the lead the admin came from. */
export function leadToQuoteDefaults(lead: LeadForPrefill) {
  const who = lead.companyName || lead.contactName || "Customer";
  const onsite = lead.requestedLocationType === "customer_onsite" || (!lead.requestedLocationSlug && !!lead.city);
  const dates = [lead.preferredDate1, lead.preferredDate2, lead.preferredDate3]
    .map((d) => dateOnlyToLocalDate(d))
    .filter(Boolean);
  const noteLines = [
    lead.trainingType ? `Training type: ${lead.trainingType}` : "",
    dates.length ? `Preferred dates: ${dates.join(", ")}` : "",
    lead.notes ? `Customer notes: ${lead.notes}` : "",
  ].filter(Boolean);
  return {
    title: `Forklift Training - ${who}`,
    companyId: lead.companyId ? String(lead.companyId) : "",
    contactId: lead.contactId ? String(lead.contactId) : "",
    originatingLeadId: lead.id != null ? String(lead.id) : "",
    participantCount: lead.traineeCount ? String(lead.traineeCount) : "",
    locationType: (onsite ? "customer_onsite" : "facility") as "customer_onsite" | "facility",
    locationSlug: onsite ? "" : lead.requestedLocationSlug || "",
    onsiteStreet: onsite ? lead.trainingAddress || "" : "",
    onsiteCity: onsite ? lead.city || "" : "",
    onsiteState: onsite ? lead.state || "" : "",
    onsiteZip: onsite ? lead.zip || "" : "",
    equipmentTypes: mapLeadEquipment(lead.equipmentTypes),
    internalNotes: noteLines.join("\n"),
  };
}

/** In-app back-navigation stack. Returns the new stack after a location
 * change: going to the page just before the current one is a "back" (pop);
 * anything else is a forward visit (push). */
export function nextNavStack(stack: string[], location: string, max = 50): string[] {
  if (stack[stack.length - 1] === location) return stack;
  if (stack.length >= 2 && stack[stack.length - 2] === location) return stack.slice(0, -1);
  const next = [...stack, location];
  return next.length > max ? next.slice(next.length - max) : next;
}
