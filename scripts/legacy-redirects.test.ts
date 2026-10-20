// Legacy WordPress URL redirects (training.miramarforklift.com DNS cutover).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LEGACY_REDIRECTS,
  LEGACY_PREFIX_REDIRECTS,
  resolveLegacyPath,
} from '../server/legacy-redirects';

const redirectTo = (p: string) => {
  const r = resolveLegacyPath(p);
  return r && r.type === 'redirect' ? r.location : r;
};

test('old product URLs map to the matching new product page', () => {
  assert.equal(redirectTo('/product/osha-forklift-operator-training/'), '/p/online-forklift-operator-training');
  assert.equal(redirectTo('/product/powered-industrial-trucks-forklift-operator-training/'), '/p/online-forklift-operator-training');
  assert.equal(redirectTo('/product/powered-industrial-trucks-forklift-operator-training-spanish/'), '/es/p/online-forklift-operator-training');
  assert.equal(redirectTo('/product/certification-cards/'), '/p/certification-cards');
  assert.equal(redirectTo('/product/reach-training-certification-las-vegas/'), '/p/reach-training-certification-las-vegas');
  assert.equal(redirectTo('/product/standard-forklift-certification-sit-down-lpg-or-epj-san-diego-ca-2-2/'), '/p/standard-forklift-certification-fresno');
  assert.equal(redirectTo('/product/forklift-train-the-trainer-certification-copy/'), '/p/scissor-aerial-train-the-trainer-san-diego');
  assert.equal(redirectTo('/product/powered-industrial-trucks-forklift-operator-training-team-2/'), '/business/products');
});

test('unmapped WooCommerce/LearnDash URLs fall back by pattern', () => {
  assert.equal(redirectTo('/product/some-deleted-product/'), '/training-programs');
  assert.equal(redirectTo('/product-category/whatever/'), '/training-programs');
  assert.equal(redirectTo('/courses/forklift-101/lessons/intro/'), '/dashboard');
  assert.equal(redirectTo('/quizzes/final-exam/'), '/dashboard');
  assert.equal(redirectTo('/shop/page/2/'), '/training-programs');
});

test('pages: faqs, account, login', () => {
  assert.equal(redirectTo('/faqs/'), '/faq');
  assert.equal(redirectTo('/faqs-2'), '/faq');
  assert.equal(redirectTo('/my-account/'), '/dashboard');
  assert.equal(redirectTo('/user-login-2/'), '/login');
  assert.equal(redirectTo('/privacy-policy-2/'), '/privacy');
});

test('trailing slash, case and query string are ignored', () => {
  assert.equal(redirectTo('/faqs'), '/faq');
  assert.equal(redirectTo('/faqs/'), '/faq');
  assert.equal(redirectTo('/FAQS/'), '/faq');
  assert.equal(redirectTo('/faqs/?utm_source=google&x=1'), '/faq');
  assert.equal(redirectTo('/product/certification-cards?add-to-cart=123'), '/p/certification-cards');
});

test('real new-site routes are never redirected', () => {
  for (const p of ['/', '/faq', '/faq/', '/cart', '/cart/', '/checkout', '/checkout/', '/blog', '/blog/',
    '/locations', '/locations/', '/documentation', '/refund-policy', '/p/certification-cards',
    '/api/products', '/es/faq', '/es/product/x', '/assets/index.js', '/uploads/a.png', '/login', '/dashboard']) {
    assert.equal(resolveLegacyPath(p), null, p);
  }
});

test('WordPress admin paths return 410 Gone', () => {
  assert.deepEqual(resolveLegacyPath('/wp-login.php'), { type: 'gone' });
  assert.deepEqual(resolveLegacyPath('/wp-login.php?action=lostpassword'), { type: 'gone' });
  assert.deepEqual(resolveLegacyPath('/wp-admin/'), { type: 'gone' });
  assert.deepEqual(resolveLegacyPath('/wp-content/uploads/2024/01/x.jpg'), { type: 'gone' });
});

test('no redirect source collides with a static App.tsx route', () => {
  const app = readFileSync('client/src/App.tsx', 'utf8');
  const routes = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => !p.includes(':')));
  for (const src of Object.keys(LEGACY_REDIRECTS)) assert.ok(!routes.has(src), `redirect source ${src} is a real route`);
  for (const [prefix] of LEGACY_PREFIX_REDIRECTS) {
    for (const r of routes) assert.ok(!r.startsWith(prefix), `prefix ${prefix} would shadow ${r}`);
  }
});

test('every redirect target exists on the new site', () => {
  const app = readFileSync('client/src/App.tsx', 'utf8');
  const routes = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]));
  const catalog = readFileSync('client/src/data/catalog.ts', 'utf8');
  const slugs = new Set([...catalog.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]));
  const targets = new Set([...Object.values(LEGACY_REDIRECTS), ...LEGACY_PREFIX_REDIRECTS.map(([, t]) => t)]);
  for (const t of targets) {
    const en = t.replace(/^\/es(?=\/)/, '');
    const pm = en.match(/^\/p\/(.+)$/);
    if (pm) { assert.ok(slugs.has(pm[1]), `missing product ${pm[1]}`); continue; }
    if (en === '/empresas/productos') continue; // ES slug for /business/products
    if (en.startsWith('/locations/')) continue; // /locations/:slug
    assert.ok(routes.has(en), `target ${t} is not a route`);
  }
});
