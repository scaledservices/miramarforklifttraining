import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { acceptCardData } from '../shared/accept-card-data';
import { entitlementBelongsToMember } from '../shared/photo-id-entitlement';
import { orderPaymentSummary } from '../shared/order-payment-summary';
import { presentExplanation } from '../server/course-presentation';
import { COURSE_STEPS } from './course-content';
import { COURSE_STEPS_ES } from './course-content-es';

test('company name label exists in both locales', () => {
  for (const lang of ['en', 'es']) {
    const j = JSON.parse(readFileSync(`client/src/locales/${lang}/common.json`, 'utf8'));
    assert.ok(j.form?.companyName, `${lang} form.companyName missing`);
  }
});

test('empty billing zip is omitted so Accept.js never reads undefined.length', () => {
  const data = acceptCardData({ cardNumber: '4007000000027', month: '12', year: '30', cardCode: '123', zip: '' });
  assert.equal('zip' in data, false);
  assert.equal(data.year, '2030');
  // Mirror of Accept.js constructCardData: hasOwnProperty(key) && value.length
  for (const k of ['cardCode', 'zip', 'fullName']) {
    if (Object.prototype.hasOwnProperty.call(data, k)) assert.doesNotThrow(() => (data as any)[k].length);
  }
  assert.equal(acceptCardData({ cardNumber: '4007 0000 0002 7', month: '1', year: '2030', cardCode: '123', zip: '92121' }).zip, '92121');
});

test('card forms build Accept.js data through the safe helper', () => {
  for (const f of ['client/src/pages/Checkout.tsx', 'client/src/pages/OrderCertCard.tsx', 'client/src/components/checkout/CardPaymentSection.tsx']) {
    const s = readFileSync(f, 'utf8');
    assert.ok(s.includes('acceptCardData('), `${f} must use acceptCardData`);
    assert.ok(!/zip:\s*[\w.]+\s*\|\|\s*undefined/.test(s), `${f} still sends zip: undefined`);
  }
});

test('a member may only use a photo ID bought on their own order', () => {
  const ent = { orderId: 10, enrollmentId: null, purchasedByUserId: 1 };
  assert.equal(entitlementBelongsToMember(ent, { userId: 5, certUserId: 5, memberOrderId: 10 }), true);
  assert.equal(entitlementBelongsToMember(ent, { userId: 5, certUserId: 5, memberOrderId: 99 }), false, 'another company order must not leak');
  assert.equal(entitlementBelongsToMember(ent, { userId: 5, certUserId: 5, memberOrderId: null }), false);
  assert.equal(entitlementBelongsToMember(ent, { userId: 1, certUserId: 5, memberOrderId: 99 }), true, 'buyer may act for member');
  assert.equal(entitlementBelongsToMember({ ...ent, enrollmentId: 3 }, { userId: 5, certUserId: 5, memberOrderId: 10 }), false, 'claimed IDs are not reusable');
});

test('confirmation summary shows the fee actually charged', () => {
  const s = orderPaymentSummary({ itemsSubtotal: 149.96, discount: 0, photoIdTotal: 0, amountPaid: 154.46 });
  assert.equal(s.cardFee, 4.5);
  assert.equal(s.totalPaid, 154.46);
  const t = orderPaymentSummary({ itemsSubtotal: 100, discount: 10, photoIdTotal: 50, amountPaid: 144.2 });
  assert.equal(t.cardFee, 4.2);
  assert.equal(orderPaymentSummary({ itemsSubtotal: 100, discount: 0, photoIdTotal: 0, amountPaid: 100 }).cardFee, 0);
});

test('order API returns the approved charged amount and confirmation renders it', () => {
  const s = readFileSync('server/routes/orders.ts', 'utf8');
  assert.ok(s.includes('amountPaid'), 'order endpoint must expose amountPaid from payments');
  const c = readFileSync('client/src/pages/OrderConfirmation.tsx', 'utf8');
  assert.ok(c.includes('orderPaymentSummary(') && c.includes('text-order-card-fee'));
});

test('crew member without a prepaid ID can buy one with billing, shipping and photo', () => {
  const s = readFileSync('client/src/pages/OrderCertCard.tsx', 'utf8');
  assert.ok(s.includes('data-testid="section-billing-address"') || s.includes('billingSameAsShipping'));
  const w = readFileSync('client/src/components/lms/WalletCardStatus.tsx', 'utf8');
  assert.ok(w.includes('button-purchase-photo-id'));
  const p = readFileSync('server/routes/photoId.ts', 'utf8');
  assert.ok(p.includes('entitlementBelongsToMember('), 'server must scope claimable IDs to the member order');
});

test('lesson banners restored in both languages', () => {
  const heroes = (steps: any[]) => steps.filter(s => (s.config?.blocks || []).some((b: any) => b.type === 'hero_image')).length;
  assert.ok(heroes(COURSE_STEPS) >= 20, 'EN banners');
  assert.equal(heroes(COURSE_STEPS_ES), heroes(COURSE_STEPS), 'ES parity');
});

test('graded explanations are shown in the viewing language', () => {
  const examIdx = COURSE_STEPS.findIndex(s => s.type === 'exam');
  const en = COURSE_STEPS[examIdx], es = COURSE_STEPS_ES[examIdx];
  const q = en.questions![0];
  const out = presentExplanation('online-forklift-operator-certification', en, { question: q.question, explanation: q.explanation }, 'es');
  assert.equal(out, es.questions![0].explanation);
});
