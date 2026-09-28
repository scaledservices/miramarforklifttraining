import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
test('wallet states never offer another payment while prepaid, ordered, or loading', async () => {
 assert.ok(existsSync('shared/wallet-card-state.ts'));
 const { walletCardState } = await import('../shared/wallet-card-state');
 assert.equal(walletCardState({loading:true}), 'loading');
 assert.equal(walletCardState({error:true}), 'unavailable');
 assert.equal(walletCardState({existingOrder:{status:'paid'}}), 'ordered');
 assert.equal(walletCardState({entitlements:[{status:'awaiting_photo'}]}), 'upload');
 assert.equal(walletCardState({entitlements:[]}), 'purchase');
});
test('card lookup shows orders for certified student even when another buyer paid',()=>{
 const s=readFileSync('server/routes/certs.ts','utf8');
 assert.match(s,/co.userId === cert.userId && !\["canceled", "refunded"\]/);
});
