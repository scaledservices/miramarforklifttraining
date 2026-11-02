import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTransactionRequest } from "../server/authorizeNetClient";
import { humanizeSlug, formatSession, surchargeLine } from "../server/payment-receipt";

test("receipt: booking charge carries name, phone, course, date and line items", () => {
  const tx: any = buildTransactionRequest("nonce", 569.25, 15, "FC-2026-000015", { zip: "92104" }, {
    customer: { name: "Brett Kelman", email: "bk@example.com", phone: "(702) 421-2738", company: "Acme Co" },
    description: "Forklift Scissor Lift EPJ Certification San Diego, San Diego, Nov 2, 2026 9:00 AM, 1 trainee",
    lineItems: [{ itemId: "forklift-scissor-lift-epj-certification-san-diego", name: "Forklift Scissor Lift EPJ Certification San Diego", quantity: 1, unitPrice: 550 }, ...surchargeLine(19.25)],
  });
  assert.equal(tx.amount, "569.25");
  assert.equal(tx.order.invoiceNumber, "FC-2026-000015");
  assert.match(tx.order.description, /Nov 2, 2026 9:00 AM, 1 trainee/);
  assert.deepEqual(tx.billTo, { firstName: "Brett", lastName: "Kelman", company: "Acme Co", zip: "92104", country: "US", phoneNumber: "(702) 421-2738" });
  assert.equal(tx.lineItems.lineItem.length, 2);
  assert.equal(tx.lineItems.lineItem[0].itemId.length <= 31, true);
  assert.equal(tx.lineItems.lineItem[0].name.length <= 31, true);
  assert.equal(tx.lineItems.lineItem[1].unitPrice, "19.25");
  assert.deepEqual(tx.userFields.userField.map((f: any) => f.name), ["customer_email", "customer_phone"]);
});

test("receipt: without a zip, billTo is omitted so the card-form zip in the nonce still drives AVS", () => {
  const tx: any = buildTransactionRequest("n", 10, 1, "FC-1", undefined, { customer: { name: "Ana Ruiz", email: "a@b.co", company: "Co" } });
  assert.equal("billTo" in tx, false);
  assert.deepEqual(tx.userFields.userField, [
    { name: "customer_name", value: "Ana Ruiz" }, { name: "customer_company", value: "Co" }, { name: "customer_email", value: "a@b.co" },
  ]);
  assert.deepEqual(tx.customer, { type: "individual", id: "1" });
});

test("receipt: JSON field order matches Authorize.net schema", () => {
  const tx: any = buildTransactionRequest("n", 10, 1, "FC-1", { firstName: "A", lastName: "B", address: "1 Main", zip: "92121" }, {
    customer: { name: "x", email: "e@x.co" }, description: "d", lineItems: [{ itemId: "i", name: "n", quantity: 1, unitPrice: 10 }],
  });
  assert.deepEqual(Object.keys(tx), ["transactionType", "amount", "payment", "order", "lineItems", "customer", "billTo", "userFields"]);
  assert.deepEqual(Object.keys(tx.billTo), ["firstName", "lastName", "address", "zip", "country"]);
});

test("receipt: no details keeps the old minimal request", () => {
  const tx: any = buildTransactionRequest("n", 10, 1, "FC-1");
  assert.deepEqual(Object.keys(tx), ["transactionType", "amount", "payment", "order", "customer"]);
});

test("receipt helpers: slug and session formatting", () => {
  assert.equal(humanizeSlug("forklift-scissor-lift-epj-certification-san-diego"), "Forklift Scissor Lift EPJ Certification San Diego");
  assert.equal(formatSession("2026-11-02", "09:00"), "Nov 2, 2026 9:00 AM");
  assert.equal(formatSession("2026-11-02", "13:30"), "Nov 2, 2026 1:30 PM");
  assert.deepEqual(surchargeLine(0), []);
});
