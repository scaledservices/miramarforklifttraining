// 2026-10-13 weekly update (Alberto): go-live fixes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeDiscountCode } from '../shared/discount-code';
import { refundableAmount } from '../shared/order-payment-summary';

test('discount codes ignore case and spaces', () => {
  assert.equal(normalizeDiscountCode(' test 99 '), 'TEST99');
  assert.equal(normalizeDiscountCode('Test99'), 'TEST99');
  assert.equal(normalizeDiscountCode(undefined), '');
});

test('booking promo error shows the server reason, not a generic message', () => {
  const src = readFileSync('client/src/pages/BookTraining.tsx', 'utf8');
  assert.match(src, /discountError === "invalid" \? t\("bookTraining\.promoInvalid"\) : discountError/);
});

test('refund returns the fee-inclusive charged amount minus prior refunds', () => {
  assert.equal(refundableAmount([{ status: 'approved', amount: '2.90' }]), 2.9);
  assert.equal(refundableAmount([{ status: 'approved', amount: '2.90' }, { status: 'refunded', amount: '1.00' }]), 1.9);
  assert.equal(refundableAmount([{ status: 'declined', amount: '5' }]), 0);
});

test('fully paid hands-on booking marks its order paid', () => {
  const src = readFileSync('server/routes/services.ts', 'utf8');
  assert.match(src, /pricing\.balance <= 0\.01\) \{\s*await storage\.updateOrderStatus\(order\.id, "paid"\)/);
});
