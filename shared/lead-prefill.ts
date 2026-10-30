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

// ─── On-site request -> manual booking ─────────────────────────────

/** Facility (lead's requestedLocationSlug) -> booking service-area slug. */
const FACILITY_AREA: Record<string, string> = {
  "san-diego": "southern-california",
  "fresno": "central-california",
  "las-vegas": "southern-nevada",
};
const CENTRAL_CA_CITIES = ["fresno", "clovis", "visalia", "madera", "hanford", "selma", "tulare", "merced", "reedley", "sanger", "porterville", "lemoore", "kingsburg", "dinuba"];

/** Booking service area for a request: its chosen facility, else by the
 * customer's state/city (NV -> Las Vegas, Central Valley -> Fresno, other CA
 * -> San Diego). Alberto can change it in the dialog. */
export function areaSlugForLead(lead: LeadForPrefill): string | null {
  if (lead.requestedLocationSlug && FACILITY_AREA[lead.requestedLocationSlug]) return FACILITY_AREA[lead.requestedLocationSlug];
  const state = (lead.state || "").trim().toUpperCase();
  const city = (lead.city || "").trim().toLowerCase();
  if (state === "NV" || state === "NEVADA") return "southern-nevada";
  if (CENTRAL_CA_CITIES.some((c) => city.includes(c))) return "central-california";
  if (state === "CA" || state === "CALIFORNIA" || city) return "southern-california";
  return null;
}

/** Pick the program that matches what the customer asked for, from the
 * programs offered at the chosen area. */
export function programForLead<T extends { slug: string }>(programs: T[], lead: LeadForPrefill): T | undefined {
  const eq = mapLeadEquipment(lead.equipmentTypes);
  const trainer = /trainer/i.test(lead.trainingType || "") || /train.the.trainer/i.test(lead.notes || "");
  const lifts = eq.some((e) => e === "scissor_lift" || e === "boom_lift");
  const forklift = eq.some((e) => !["scissor_lift", "boom_lift"].includes(e));
  const want = trainer
    ? (lifts && !forklift ? "scissor-aerial-train-the-trainer" : "forklift-train-the-trainer")
    : (lifts && !forklift ? "scissor-aerial-boom-lift-certification" : "standard-forklift-certification");
  return programs.find((p) => p.slug.startsWith(want)) ?? programs[0];
}

export interface LeadForBooking extends LeadForPrefill {
  email?: string | null;
  phone?: string | null;
}

/** Booking dialog values from an on-site request. */
export function leadToBookingDefaults(lead: LeadForBooking) {
  const onsite = lead.requestedLocationType === "customer_onsite" || (!lead.requestedLocationSlug && !!lead.trainingAddress);
  const eqLabels = (lead.equipmentTypes || []).filter(Boolean);
  const notes = [
    lead.id != null ? `From quote request #${lead.id}${lead.companyName ? ` (${lead.companyName})` : ""}.` : "",
    lead.trainingType ? `Training type: ${lead.trainingType}.` : "",
    eqLabels.length ? `Equipment: ${eqLabels.join(", ")}.` : "",
    lead.notes ? `Customer notes: ${lead.notes}` : "",
  ].filter(Boolean).join("\n");
  return {
    areaSlug: areaSlugForLead(lead),
    where: (onsite ? "onsite" : "facility") as "onsite" | "facility",
    sessionDate: dateOnlyToLocalDate(lead.preferredDate1),
    participantCount: lead.traineeCount && lead.traineeCount > 0 ? String(lead.traineeCount) : "1",
    contactName: lead.contactName || "",
    contactPhone: lead.phone || "",
    contactEmail: lead.email || "",
    customerAddress: lead.trainingAddress || "",
    customerCity: lead.city || "",
    customerState: lead.state || "",
    customerZip: lead.zip || "",
    specialRequests: notes,
  };
}
