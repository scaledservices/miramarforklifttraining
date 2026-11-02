import { test } from "node:test";
import assert from "node:assert/strict";
import { trainingLabel, bookingLocation, formatBookingNumber, humanizeSlug } from "../shared/booking-labels";

test("booking labels: training name from slug, with city", () => {
  assert.equal(trainingLabel("standard-forklift-certification-las-vegas"), "Standard Forklift Certification (Las Vegas)");
  assert.equal(trainingLabel("forklift-scissor-lift-epj-certification-san-diego"), "Forklift Scissor Lift EPJ Certification (San Diego)");
  assert.equal(trainingLabel("standard-forklift-certification-fresno, scissor-lift-add-on-fresno"), "Standard Forklift Certification (Fresno) + Scissor Lift Add On (Fresno)");
  assert.equal(trainingLabel("Initial Certification"), "Initial Certification");
  assert.equal(trainingLabel(""), "");
  assert.equal(humanizeSlug("epj-training"), "EPJ Training");
});

test("booking labels: facility vs customer on-site address", () => {
  const f = bookingLocation({ address: "3301 W. Martin Ave Suite A", city: "Las Vegas", state: "NV", zip: "89118" });
  assert.equal(f.atFacility, true);
  assert.equal(f.label, "Training Location");
  assert.match(f.text, /^Miramar Las Vegas facility: 3301 W\. Martin Ave Suite A, Las Vegas, NV 89118$/);
  const f2 = bookingLocation({ address: "3301 W Martin Ave Suite A", city: "Las Vegas", state: "NV", zip: "89118" });
  assert.equal(f2.atFacility, true);
  const c = bookingLocation({ address: "1200 Harbor Dr", city: "Chula Vista", state: "CA", zip: "91910" });
  assert.deepEqual(c, { label: "On-site Address (customer)", text: "1200 Harbor Dr, Chula Vista, CA 91910", atFacility: false });
});

test("booking labels: short booking numbers", () => {
  assert.equal(formatBookingNumber(2026, 16), "BK-2026-0016");
  assert.equal(formatBookingNumber(2026, 12345), "BK-2026-12345");
});
