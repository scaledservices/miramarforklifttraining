import { test } from "node:test";
import assert from "node:assert/strict";
import {
  weekdayOf, summarizeClassDays, formatClassDays, formatClassDate, addDaysIso, localIsoDate,
  validateNoDateLead, buildNoDateLeadPayload,
} from "../shared/booking-availability";
import { remapProductsToFacility, slugsNotInArea, slugBase, slugFacility, slugsInDisplayString } from "../shared/booking-city";
import { BOOKING_PRODUCT_PRICES } from "../shared/config/bookingPricing";

test("weekdayOf is timezone-safe for YYYY-MM-DD strings", () => {
  const prev = process.env.TZ;
  for (const tz of ["America/Los_Angeles", "Pacific/Kiritimati", "UTC"]) {
    process.env.TZ = tz;
    assert.equal(weekdayOf("2026-11-16"), 1); // Monday
    assert.equal(weekdayOf("2026-11-21"), 6); // Saturday
    assert.equal(weekdayOf("2026-11-15"), 0); // Sunday
    assert.equal(formatClassDate("2026-11-16", "en"), "Mon, Nov 16");
  }
  process.env.TZ = prev;
});

test("summarizeClassDays: Las Vegas Mondays only, next date skips past/unavailable", () => {
  const slots = [
    { date: "2026-11-09", available: true },  // past Monday
    { date: "2026-11-16", available: false }, // full
    { date: "2026-11-23", available: true },
    { date: "2026-11-23", available: true },
    { date: "2026-11-30", available: true },
  ];
  assert.deepEqual(summarizeClassDays(slots, "2026-11-14"), { weekdays: [1], nextDate: "2026-11-23" });
  assert.equal(formatClassDays([1], "en"), "Mondays");
  assert.equal(formatClassDays([1], "es"), "lunes");
});

test("summarizeClassDays: San Diego Mon/Wed/Fri/Sat ordered Monday first", () => {
  const slots = ["2026-11-21", "2026-11-20", "2026-11-18", "2026-11-16"].map((date) => ({ date, available: true }));
  const s = summarizeClassDays(slots, "2026-11-14");
  assert.deepEqual(s.weekdays, [1, 3, 5, 6]);
  assert.equal(s.nextDate, "2026-11-16");
  assert.equal(formatClassDays(s.weekdays, "en"), "Mondays, Wednesdays, Fridays and Saturdays");
  assert.equal(formatClassDays([6], "es"), "sábados");
});

test("summarizeClassDays: empty / bad input shows nothing", () => {
  assert.deepEqual(summarizeClassDays(undefined, "2026-11-14"), { weekdays: [], nextDate: null });
  assert.deepEqual(summarizeClassDays([], "2026-11-14"), { weekdays: [], nextDate: null });
  assert.equal(formatClassDays([], "en"), "");
});

test("date math: addDaysIso and localIsoDate", () => {
  assert.equal(addDaysIso("2026-11-14", 56), "2027-01-09");
  assert.equal(addDaysIso("2026-03-07", 1), "2026-03-08");
  assert.equal(localIsoDate(new Date(2026, 10, 14, 23, 30)), "2026-11-14");
});

test("no-date lead: validation mirrors /api/onsite-requests", () => {
  const email = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  const phone = (p: string) => p.replace(/\D/g, "").length === 10;
  assert.deepEqual(validateNoDateLead({ name: "Jo", email: "jo@x.com", phone: "", people: 2 }, email, phone), []);
  assert.deepEqual(validateNoDateLead({ name: "J", email: "bad", phone: "123", people: 0 }, email, phone), ["name", "email", "phone", "people"]);
});

test("no-date lead: payload marks a hands-on facility date request", () => {
  const p = buildNoDateLeadPayload({
    name: " Jo Smith ", email: "jo@x.com", phone: "(702) 555-0100", preferredDates: "Any Thursday in Dec",
    people: 3, city: "Las Vegas",
    facility: { slug: "las-vegas", street: "3301 W. Martin Ave Suite A", city: "Las Vegas", state: "NV", zip: "89118" },
    programs: ["Standard Forklift Certification"], leadSource: "not-an-enum", locale: "en",
  });
  assert.equal(p.contactName, "Jo Smith");
  assert.equal(p.requestedLocationType, "facility");
  assert.equal(p.requestedLocationSlug, "las-vegas");
  assert.equal(p.leadSource, "direct");
  assert.equal(p.traineeCount, 3);
  assert.deepEqual(p.equipmentTypes, ["Standard Forklift Certification"]);
  assert.equal(p.preferredDate1, "Any Thursday in Dec");
  assert.match(p.notes, /Hands-on class date request/);
  assert.match(p.notes, /Preferred date\(s\): Any Thursday in Dec/);
  assert.doesNotMatch(p.notes, /[\u2013\u2014]/);
});

const catalog = [
  { slug: "standard-forklift-certification-san-diego", category: "hands-on", location: "san-diego" },
  { slug: "scissor-aerial-boom-lift-certification-san-diego", category: "hands-on", location: "san-diego" },
  { slug: "reach-training-certification-san-diego", category: "hands-on", location: "san-diego" },
  { slug: "standard-forklift-certification-las-vegas", category: "hands-on", location: "las-vegas" },
  { slug: "reach-training-certification-las-vegas", category: "hands-on", location: "las-vegas" },
  { slug: "standard-forklift-certification-fresno", category: "hands-on", location: "fresno" },
  { slug: "forklift-train-the-trainer-fresno", category: "trainer", location: "fresno" },
  { slug: "forklift-train-the-trainer-san-diego", category: "trainer", location: "san-diego" },
];

test("slug helpers", () => {
  assert.equal(slugFacility("standard-forklift-certification-las-vegas"), "las-vegas");
  assert.equal(slugBase("standard-forklift-certification-las-vegas"), "standard-forklift-certification");
  assert.equal(slugFacility("forklift-train-the-trainer-kit"), null);
});

test("remap: San Diego URL product follows the customer to Las Vegas (LV-1116-02)", () => {
  const r = remapProductsToFacility([catalog[0]], "las-vegas", catalog);
  assert.deepEqual(r.products.map((p) => p.slug), ["standard-forklift-certification-las-vegas"]);
  assert.deepEqual(r.dropped, []);
});

test("remap: programs the new city does not offer are dropped", () => {
  const r = remapProductsToFacility([catalog[0], catalog[1], catalog[2]], "las-vegas", catalog);
  assert.deepEqual(r.products.map((p) => p.slug), ["standard-forklift-certification-las-vegas", "reach-training-certification-las-vegas"]);
  assert.deepEqual(r.dropped.map((p) => p.slug), ["scissor-aerial-boom-lift-certification-san-diego"]);
  const f = remapProductsToFacility([catalog[7]], "fresno", catalog);
  assert.deepEqual(f.products.map((p) => p.slug), ["forklift-train-the-trainer-fresno"]);
  assert.deepEqual(remapProductsToFacility([], "fresno", catalog), { products: [], dropped: [] });
});

test("server guard: slugs must match the service area's city", () => {
  assert.deepEqual(slugsNotInArea(["standard-forklift-certification-san-diego"], "southern-nevada"), ["standard-forklift-certification-san-diego"]);
  assert.deepEqual(slugsNotInArea(["standard-forklift-certification-las-vegas"], "southern-nevada"), []);
  assert.deepEqual(slugsNotInArea(["standard-forklift-certification-fresno", "forklift-train-the-trainer-san-diego"], "central-california"), ["forklift-train-the-trainer-san-diego"]);
  assert.deepEqual(slugsNotInArea(["standard-forklift-certification-san-diego"], "qa-staging-area"), []);
  assert.deepEqual(
    slugsInDisplayString("standard-forklift-certification-san-diego + scissor-aerial-boom-lift-certification-san-diego | [Equipment: Other]", BOOKING_PRODUCT_PRICES),
    ["standard-forklift-certification-san-diego", "scissor-aerial-boom-lift-certification-san-diego"],
  );
  // Every bookable priced slug carries a city suffix, so the guard can't reject a valid self-serve booking.
  for (const s of Object.keys(BOOKING_PRODUCT_PRICES)) assert.ok(slugFacility(s), s);
});
