import { test } from "node:test";
import assert from "node:assert/strict";
import { billingAddressProblems, normalizeBillingAddress, formatBillingAddress } from "../shared/billing-address";

test("billing address: complete address passes and formats", () => {
  const b = normalizeBillingAddress({ address: " 1200 Harbor Dr ", city: "Chula Vista", state: "ca", zip: "91910" });
  assert.deepEqual(b, { address: "1200 Harbor Dr", city: "Chula Vista", state: "CA", zip: "91910" });
  assert.equal(formatBillingAddress(b), "1200 Harbor Dr, Chula Vista, CA 91910");
});

test("billing address: missing or bad fields are reported", () => {
  assert.deepEqual(billingAddressProblems({ address: "", city: "X", state: "ZZ", zip: "123" }), ["address", "city", "state", "zip"]);
  assert.deepEqual(billingAddressProblems(null), ["address", "city", "state", "zip"]);
  assert.equal(normalizeBillingAddress({ address: "1 Main", city: "SD", state: "CA" }), null);
});
