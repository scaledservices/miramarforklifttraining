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

test('manual bookings get an order and can record a check at creation', () => {
  const src = readFileSync('server/routes/services.ts', 'utf8');
  assert.match(src, /async function ensureBookingOrder/);
  // record-balance no longer dead-ends on orderless bookings
  assert.doesNotMatch(src, /Booking has no linked order/);
  assert.match(src, /const pay = req\.body\.payment/);
  const dlg = readFileSync('client/src/components/admin/NewBookingDialog.tsx', 'utf8');
  assert.match(dlg, /data-testid="input-nb-payment-reference"/);
});

test('manual payments refund offline instead of failing', () => {
  const src = readFileSync('server/payments.ts', 'utf8');
  assert.match(src, /payment\.provider\?\.startsWith\("manual_"\)/);
});

test('existing crew admin seat purchases attach to their crew', () => {
  const src = readFileSync('server/routes/authorizeNet.ts', 'utf8');
  assert.match(src, /if \(group\) \{\s*await storage\.updateOrderGroupId\(orderId, group\.id\)/);
});

test('buy-more-seats link targets the crew course as a crew seat', async () => {
  const src = readFileSync('client/src/lib/crewSeats.ts', 'utf8');
  assert.match(src, /seats=1&crew=1/);
  const dash = readFileSync('client/src/pages/group/GroupDashboard.tsx', 'utf8');
  const seats = readFileSync('client/src/pages/group/GroupSeats.tsx', 'utf8');
  assert.match(dash, /button-header-buy-seats/);
  assert.match(seats, /button-header-buy-seats/);
  const pd = readFileSync('client/src/pages/ProductDetail.tsx', 'utf8');
  assert.match(pd, /seats > 1 \|\| forceCrew/);
});

// ---- San Diego Saturdays yield to Fresno (Peter: "prioritize Fresno") ----
import { conditionalDaysOf, isConditionalDate, yieldsTo } from '../shared/conditional-days';
const SD = { id: 1, slug: 'southern-california', availabilityRules: { daysOfWeek: [1, 3, 5], conditionalDays: { daysOfWeek: [6], priorityAreaSlug: 'central-california', timeSlots: [{ startTime: '09:00', endTime: '13:00' }] } } };
const FRESNO = { id: 2, slug: 'central-california', availabilityRules: { daysOfWeek: [6] } };
const SAT = '2026-11-07', WED = '2026-11-04';

test('San Diego offers Saturday as a conditional day, 9-1 only', () => {
  assert.equal(isConditionalDate(SD, SAT), true);
  assert.equal(isConditionalDate(SD, WED), false);
  assert.deepEqual(conditionalDaysOf(SD)!.timeSlots, [{ startTime: '09:00', endTime: '13:00' }]);
  assert.equal(conditionalDaysOf(FRESNO), null);
});

test('a San Diego Saturday booking never blocks Fresno (Fresno has priority)', () => {
  assert.equal(yieldsTo(SD, 'central-california', SAT), true);
  // ...but a San Diego weekday booking still counts as normal for other cities
  assert.equal(yieldsTo(SD, 'central-california', WED), false);
  // ...and Fresno bookings are never ignored for San Diego
  assert.equal(yieldsTo(FRESNO, 'southern-california', SAT), false);
});

test('slot generator closes the Saturday when Fresno is booked; booking API refuses it', () => {
  const st = readFileSync('server/storage.ts', 'utf8');
  assert.match(st, /isConditional && !priorityBooked\.has\(dateStr\)/);
  const sv = readFileSync('server/routes/services.ts', 'utf8');
  assert.equal((sv.match(/isConditionalDateClosed\(/g) || []).length, 3); // customer, admin, reschedule
  const seed = readFileSync('scripts/seed-service-areas.ts', 'utf8');
  assert.match(seed, /priorityAreaSlug: "central-california"/);
});

test('crew photo-ID reminder route uses real tables and helpers', () => {
  const src = readFileSync('server/routes/groups.ts', 'utf8');
  const route = src.slice(src.indexOf('/remind-photo-id"'), src.indexOf('/members/:memberId/remind", requireAuth'));
  for (const gone of ['getCourseGroup', 'photoIdUploadTokens', 'getUserEmail', 'getPhotoIdEntitlementsForUser', 'userRole']) {
    assert.ok(!route.includes(gone), `still references ${gone}`);
  }
  assert.match(route, /sendPhotoIdUploadRequest\(\{/);
});

// ---- 2026-10-14 production review ----
import { reversalMethodFor, anetErrorText } from '../server/authorizeNetClient';

test('same-day charges are voided, settled ones refunded, reversed ones refused', () => {
  assert.equal(reversalMethodFor('capturedPendingSettlement'), 'void');
  assert.equal(reversalMethodFor('settledSuccessfully'), 'refund');
  assert.equal(reversalMethodFor('voided'), 'none');
  assert.equal(reversalMethodFor(undefined), 'none');
});

test('Authorize.net error text is read from messages.message[0].text', () => {
  assert.equal(anetErrorText({ messages: { message: [{ text: 'The record cannot be found.' }] } }), 'The record cannot be found.');
  const src = readFileSync('server/authorizeNetClient.ts', 'utf8');
  assert.doesNotMatch(src, /creditCardCardNumber/);
});

test('refund asks for confirmation first', () => {
  const src = readFileSync('client/src/pages/admin/AdminOrders.tsx', 'utf8');
  assert.match(src, /onClick=\{\(\) => setRefundOrder\(order\)\}/);
  assert.match(src, /button-confirm-refund/);
});

test('wallet cards take no discount codes', () => {
  const page = readFileSync('client/src/pages/OrderCertCard.tsx', 'utf8');
  assert.doesNotMatch(page, /input-discount-code/);
  const route = readFileSync('server/routes/certs.ts', 'utf8');
  assert.match(route, /Discount codes apply to training only/);
});

test('booking/order/payment alerts always include the office inbox (online@)', async () => {
  process.env.ADMIN_EMAIL = 'online@miramarforklift.com';
  const { withOfficeInbox } = await import('../server/email');
  assert.deepEqual(withOfficeInbox([]), ['online@miramarforklift.com']);
  assert.deepEqual(withOfficeInbox(['Training@MiramarForklift.com', 'online@miramarforklift.com']),
    ['online@miramarforklift.com', 'training@miramarforklift.com']);
});

import { programsForArea, autoPrice } from '../shared/manual-booking';
import { catalog } from '../client/src/data/catalog';

test('manual booking shows only the chosen location\'s programs, no duplicates', () => {
  const fresno = programsForArea(catalog as any, 'central-california');
  assert.deepEqual(fresno.map((p) => p.slug), ['standard-forklift-certification-fresno']);
  const sd = programsForArea(catalog as any, 'southern-california');
  assert.equal(sd.length, 8);
  assert.equal(new Set(sd.map((p) => p.title)).size, sd.length);
  assert.ok(sd.every((p) => p.slug.endsWith('-san-diego')));
  assert.equal(programsForArea(catalog as any, 'southern-nevada').length, 5);
  assert.deepEqual(programsForArea(catalog as any, undefined), []);
});

test('manual booking price fills from program x participants', () => {
  assert.equal(autoPrice(280, '3'), '840.00');
  assert.equal(autoPrice(280, '0'), '');
  assert.equal(autoPrice(undefined, '2'), '');
});
