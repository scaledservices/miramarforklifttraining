import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p: string) => readFileSync(p, 'utf8');
test('prepaid card lookup uses query parameter and waits before showing payment', () => {
 const s = read('client/src/pages/OrderCertCard.tsx');
 assert.match(s, /entitlements\?certificationId=\$\{certId\}/);
 assert.match(s, /isLoading \|\| entitlementsLoading/);
 assert.doesNotMatch(s, /button-shipping-expedited/);
 assert.doesNotMatch(s, /\$4\.99|\$9\.99/);
});
test('buyer company is captured and persisted without a schema migration', () => {
 assert.match(read('client/src/components/checkout/CheckoutInlineAuth.tsx'), /input-checkout-company/);
 assert.match(read('client/src/pages/Register.tsx'), /input-register-company/);
 assert.match(read('server/routes/auth.ts'), /savedShippingAddress:.*companyName/);
});
