// Expense netting rule (2026-11-14). Run: DATABASE_URL=postgres://localhost/none npx tsx --test scripts/training-expenses.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSplit, computeExpenseEffect } from "../server/routes/money";

const cfg = { albertoCommissionPercent: 30, newCustomerCommissionPercent: 50, newCustomerAlbertoSharePercent: 50 };
const sum = (o: { alberto: number; scaled: number; miramar: number }) => Math.round((o.alberto + o.scaled + o.miramar) * 100) / 100;

test("new customer: expense comes off the top, Alberto is reimbursed", () => {
  // $1,000 order, $100 travel. Net $900 -> pool 50% = $450 -> 225/225; Miramar 450; Alberto +100 reimbursed.
  const order = computeSplit(1000, true, cfg);
  const exp = computeExpenseEffect(100, true, cfg);
  assert.deepEqual({ a: order.alberto + exp.alberto, s: order.scaled + exp.scaled, m: order.miramar + exp.miramar }, { a: 325, s: 225, m: 450 });
  assert.equal(exp.reimbursement, 100);
  assert.equal(sum(exp), 0);
});

test("returning customer: reimbursement only, commission unchanged", () => {
  const exp = computeExpenseEffect(80, false, cfg);
  assert.deepEqual({ a: exp.alberto, s: exp.scaled, m: exp.miramar }, { a: 80, s: 0, m: -80 });
  assert.equal(sum(exp), 0);
});

test("works with a 30% pool too (15/15)", () => {
  const c = { ...cfg, newCustomerCommissionPercent: 30 };
  const order = computeSplit(1000, true, c);
  const exp = computeExpenseEffect(100, true, c);
  assert.equal(order.scaled + exp.scaled, 135); // 15% of 900
  assert.equal(order.alberto + exp.alberto, 235); // 135 + 100 reimbursed
});
