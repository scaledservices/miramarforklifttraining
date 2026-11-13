// New vs existing customer rule (2026-10-26).
// Run: DATABASE_URL=postgres://localhost/none npx tsx --test scripts/customer-classification.test.ts
// (the pure functions never touch the database; the env var only satisfies server/db import)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLegacyIndex, classifyEmail, classifyOrder } from "../server/customerClassification";

const index = buildLegacyIndex([
  "Buyer@AcmeLogistics.com",
  "joe.smith@gmail.com",
  "ops@ucsd.edu",
  "not-an-email",
  null,
]);

test("exact email on the list is existing", () => {
  assert.deepEqual(classifyEmail("buyer@acmelogistics.com", index), { classification: "existing", source: "legacy_email" });
  assert.deepEqual(classifyEmail("  JOE.SMITH@gmail.com ", index), { classification: "existing", source: "legacy_email" });
});

test("same company domain is existing", () => {
  assert.deepEqual(classifyEmail("newhire@acmelogistics.com", index), { classification: "existing", source: "legacy_domain" });
  assert.equal(classifyEmail("library@ucsd.edu", index).classification, "existing");
});

test("generic mailbox domains need an exact email match", () => {
  assert.deepEqual(classifyEmail("someone.else@gmail.com", index), { classification: "new", source: "not_on_legacy_list" });
  assert.equal(index.domains.has("gmail.com"), false);
});

test("not on the list, or no email, is new", () => {
  assert.equal(classifyEmail("nic@jbhunt.com", index).classification, "new");
  assert.deepEqual(classifyEmail(null, index), { classification: "new", source: "no_email" });
});

test("a per-order override wins over the list", () => {
  assert.deepEqual(classifyOrder(20, "buyer@acmelogistics.com", index, { "20": "new" }), { classification: "new", source: "override" });
  assert.deepEqual(classifyOrder(21, "nic@jbhunt.com", index, { "20": "new" }), { classification: "new", source: "not_on_legacy_list" });
  assert.equal(classifyOrder(22, "nic@jbhunt.com", index, { "22": "existing" }).classification, "existing");
});
