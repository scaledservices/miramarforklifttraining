import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeBookingPrice } from '../shared/config/bookingPricing';

test('facility TTT uses the catalog per-attendee price, not travel/session pricing', () => {
  const quote = computeBookingPrice(['forklift-train-the-trainer-san-diego'], 4);
  assert.equal(quote?.perPerson, 750);
  assert.equal(quote?.total, 3000);
  assert.equal('travelFee' in quote!, false);
});
test('hands-on prices and invalid input behavior remain intact', () => {
  assert.equal(computeBookingPrice(['standard-forklift-certification-san-diego'], 2)?.total, 560);
  assert.equal(computeBookingPrice(['unknown'], 1), null);
  assert.equal(computeBookingPrice([], 1), null);
  assert.equal(computeBookingPrice(['forklift-train-the-trainer-san-diego'], 0), null);
});
test('booking uses facility addresses only and delays fee-inclusive sidebar until payment', () => {
  const source = readFileSync('client/src/pages/BookTraining.tsx', 'utf8');
  assert.equal(source.includes('input-ttt-address'), false);
  assert.equal(source.includes('row-travel-fee'), false);
  assert.match(source, /bookingPricing && step === 4/);
});
