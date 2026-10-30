// Meeting 2026-10-26 admin fixes. Run: npx tsx --test scripts/meeting-1026.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateOnlyToLocalInput,
  dateOnlyToLocalDate,
  mapLeadEquipment,
  leadToQuoteDefaults,
  nextNavStack,
  areaSlugForLead,
  programForLead,
  leadToBookingDefaults,
} from "../shared/lead-prefill";

test("lead date 2026-10-31 stays the 31st (was shown as the 30th)", () => {
  process.env.TZ = "America/Los_Angeles";
  assert.equal(dateOnlyToLocalInput("2026-10-31"), "2026-10-31T08:00");
  assert.equal(dateOnlyToLocalDate("2026-10-31"), "2026-10-31");
  assert.equal(dateOnlyToLocalInput(""), "");
  assert.equal(dateOnlyToLocalInput("not a date"), "");
});

test("equipment labels map to quote codes", () => {
  assert.deepEqual(
    mapLeadEquipment(["Counterbalance Forklift", "Scissor Lift", "Boom/Aerial Lift", "Other"]),
    ["sit_down_counterbalance", "scissor_lift", "boom_lift"],
  );
});

test("quote defaults prefill from a facility lead", () => {
  const d = leadToQuoteDefaults({
    id: 2, companyName: "Scaled Services", contactName: "Peter", traineeCount: 1,
    equipmentTypes: ["Counterbalance Forklift"], requestedLocationSlug: "san-diego",
    requestedLocationType: "facility", preferredDate1: "2026-10-31", notes: "Saturday please",
  });
  assert.equal(d.title, "Forklift Training - Scaled Services");
  assert.equal(d.originatingLeadId, "2");
  assert.equal(d.participantCount, "1");
  assert.equal(d.locationType, "facility");
  assert.equal(d.locationSlug, "san-diego");
  assert.deepEqual(d.equipmentTypes, ["sit_down_counterbalance"]);
  assert.match(d.internalNotes, /Preferred dates: 2026-10-31/);
  assert.match(d.internalNotes, /Saturday please/);
});

test("quote defaults prefill the customer address for an onsite lead", () => {
  const d = leadToQuoteDefaults({
    contactName: "Mike", requestedLocationType: "customer_onsite",
    trainingAddress: "1 Main St", city: "Fresno", state: "CA", zip: "93721",
  });
  assert.equal(d.locationType, "customer_onsite");
  assert.equal(d.onsiteCity, "Fresno");
  assert.equal(d.locationSlug, "");
});

test("back stack: drill down then back returns to the previous page", () => {
  let s: string[] = [];
  for (const p of ["/admin", "/admin/onsite-requests", "/admin/onsite-requests/2", "/admin/quotes/new"]) s = nextNavStack(s, p);
  assert.equal(s.length, 4);
  s = nextNavStack(s, "/admin/onsite-requests/2"); // browser back
  assert.deepEqual(s, ["/admin", "/admin/onsite-requests", "/admin/onsite-requests/2"]);
  assert.equal(nextNavStack(s, "/admin/onsite-requests/2"), s); // same page, no change
});

test("booking from request: area from facility or customer location", () => {
  assert.equal(areaSlugForLead({ requestedLocationSlug: "las-vegas" }), "southern-nevada");
  assert.equal(areaSlugForLead({ requestedLocationType: "customer_onsite", city: "Henderson", state: "NV" }), "southern-nevada");
  assert.equal(areaSlugForLead({ requestedLocationType: "customer_onsite", city: "Clovis", state: "CA" }), "central-california");
  assert.equal(areaSlugForLead({ requestedLocationType: "customer_onsite", city: "Chula Vista", state: "CA" }), "southern-california");
});

test("booking from request: program follows equipment and training type", () => {
  const programs = [
    { slug: "standard-forklift-certification-fresno" },
    { slug: "scissor-aerial-boom-lift-certification-fresno" },
    { slug: "forklift-train-the-trainer-fresno" },
    { slug: "scissor-aerial-train-the-trainer-fresno" },
  ];
  assert.equal(programForLead(programs, { equipmentTypes: ["Counterbalance Forklift"] })?.slug, "standard-forklift-certification-fresno");
  assert.equal(programForLead(programs, { equipmentTypes: ["Scissor Lift"] })?.slug, "scissor-aerial-boom-lift-certification-fresno");
  assert.equal(programForLead(programs, { equipmentTypes: ["Reach Truck"], trainingType: "Train the Trainer" })?.slug, "forklift-train-the-trainer-fresno");
});

test("booking from request: contact, date, onsite address and notes carry over", () => {
  const d = leadToBookingDefaults({
    id: 7, companyName: "Acme", contactName: "Ana", email: "ana@acme.com", phone: "6195550100",
    requestedLocationType: "customer_onsite", trainingAddress: "1 Main St", city: "Chula Vista", state: "CA", zip: "91910",
    traineeCount: 4, preferredDate1: "2026-10-31", equipmentTypes: ["Counterbalance Forklift"], trainingType: "Initial Certification", notes: "Saturday",
  });
  assert.equal(d.where, "onsite");
  assert.equal(d.sessionDate, "2026-10-31");
  assert.equal(d.participantCount, "4");
  assert.equal(d.contactEmail, "ana@acme.com");
  assert.equal(d.customerZip, "91910");
  assert.match(d.specialRequests, /quote request #7 \(Acme\)/);
  assert.match(d.specialRequests, /Equipment: Counterbalance Forklift/);
});
