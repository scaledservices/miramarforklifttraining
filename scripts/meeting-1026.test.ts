// Meeting 2026-10-26 admin fixes. Run: npx tsx --test scripts/meeting-1026.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateOnlyToLocalInput,
  dateOnlyToLocalDate,
  mapLeadEquipment,
  leadToQuoteDefaults,
  nextNavStack,
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
