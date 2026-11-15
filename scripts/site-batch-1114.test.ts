// Site batch 2026-11-14: location pricing by equipment, location about copy,
// online price consistency, social links, canonical host redirect.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { locations, getAllLocations } from '../shared/config/locations';
import { getLocationPricingPackages, getLocationEquipmentKeys } from '../shared/config/locationPricing';
import { socialLinks, getSocialProfiles, getSameAs } from '../shared/config/social';
import { ONLINE_FORKLIFT_COURSE_PRICE, ONLINE_FORKLIFT_COURSE_PRICE_DISPLAY } from '../shared/config/onlinePricing';
import {
  resolveCanonicalHostRedirect,
  canonicalHostMiddleware,
  LEGACY_PRODUCTION_HOST,
} from '../server/canonical-host';

// ── 1. Location pricing is driven by location equipment ──────────────
test('Las Vegas hides packages needing scissor/aerial equipment', () => {
  const keys = getLocationPricingPackages(locations['las-vegas']).map((p) => p.key);
  assert.deepEqual(keys, ['standard', 'reachForklift', 'orderPickerForklift']);
  const names = getLocationPricingPackages(locations['las-vegas']).map((p) => p.name).join(' ');
  assert.doesNotMatch(names, /scissor|aerial|multi/i);
});

test('San Diego (full equipment) keeps every package', () => {
  assert.equal(getLocationPricingPackages(locations['san-diego']).length, 6);
});

test('pricing filter is generic: no equipment means no packages', () => {
  assert.deepEqual(getLocationPricingPackages({ equipmentTypes: [] }), []);
  assert.deepEqual(
    getLocationPricingPackages({ equipmentTypes: ['Scissor Lift', 'Aerial/Boom Lift'] }).map((p) => p.key),
    ['scissorAerial'],
  );
});

test('equipment keys parse the config labels', () => {
  const lv = getLocationEquipmentKeys(locations['las-vegas']);
  assert.deepEqual([...lv].sort(), ['counterbalance', 'epj', 'orderPicker', 'reach']);
});

// ── 2. About copy ────────────────────────────────────────────────────
test('every location has a real EN + ES about paragraph, no dashes', () => {
  for (const loc of getAllLocations()) {
    for (const text of [loc.about, loc.es?.about ?? '']) {
      assert.ok(text.length > 150, `${loc.slug} about too short`);
      assert.doesNotMatch(text, /[\u2013\u2014]/, `${loc.slug} about has an en/em dash`);
      assert.match(text, /onsite|en sitio/i, `${loc.slug} about should mention onsite`);
    }
  }
  assert.match(locations['las-vegas'].about, /3301 W Martin Ave Ste A/);
  assert.doesNotMatch(locations['las-vegas'].about, /scissor|aerial/i);
});

// ── 3. Online price consistency ──────────────────────────────────────
test('online display price matches the seeded (charged) course price', () => {
  for (const f of ['scripts/course-content.ts', 'scripts/course-content-es.ts']) {
    const m = readFileSync(f, 'utf8').match(/price: "([\d.]+)"/);
    assert.ok(m, f);
    assert.equal(Number(m![1]), ONLINE_FORKLIFT_COURSE_PRICE, f);
  }
  assert.equal(ONLINE_FORKLIFT_COURSE_PRICE_DISPLAY, '$45.00');
});

test('no stale $59.99 online price in server SSR / SEO sources or locales', () => {
  for (const f of [
    'server/seo-ssr.ts', 'server/seo.ts', 'client/index.html',
    'client/src/locales/en/common.json', 'client/src/locales/es/common.json',
    'scripts/seo-content.ts', 'scripts/seo-content-es.ts', 'scripts/seo-enrich.ts',
    'scripts/generate-knowledge-pages.ts', 'scripts/generate-knowledge-pages-batch2.ts',
  ]) {
    assert.ok(!readFileSync(f, 'utf8').includes('59.99'), `${f} still mentions 59.99`);
  }
});

// ── 4. Social links ──────────────────────────────────────────────────
test('social config: instagram, linkedin and facebook set, in order', () => {
  assert.equal(socialLinks.facebook, 'https://www.facebook.com/1425690627295010');
  assert.deepEqual(getSocialProfiles().map((p) => p.network), ['instagram', 'linkedin', 'facebook']);
  assert.deepEqual(getSameAs(), [
    'https://www.instagram.com/miramarforklifttraining',
    'https://www.linkedin.com/company/miramar-forklift-training',
    'https://www.facebook.com/1425690627295010',
  ]);
  assert.deepEqual(
    getSocialProfiles({ instagram: null, linkedin: '', facebook: 'https://facebook.com/x' }).map((p) => p.network),
    ['facebook'],
  );
});

test('footer renders social links in a new tab with rel=noopener and aria-label', () => {
  const footer = readFileSync('client/src/components/layout/Footer.tsx', 'utf8');
  assert.match(footer, /getSocialProfiles\(\)/);
  assert.match(footer, /target="_blank"/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.match(footer, /aria-label=/);
});

// ── 5. Canonical host redirect ───────────────────────────────────────
test('old Railway prod host redirects to canonical domain, path + query kept', () => {
  assert.equal(
    resolveCanonicalHostRedirect(LEGACY_PRODUCTION_HOST, '/en/locations/las-vegas?utm_source=g&x=1'),
    'https://training.miramarforklift.com/en/locations/las-vegas?utm_source=g&x=1',
  );
  assert.equal(resolveCanonicalHostRedirect(LEGACY_PRODUCTION_HOST, '/'), 'https://training.miramarforklift.com/');
  assert.equal(
    resolveCanonicalHostRedirect('MiramarForkliftTraining-Production.up.railway.app:443', '/faq'),
    'https://training.miramarforklift.com/faq',
  );
});

test('other hosts are never redirected', () => {
  for (const host of [
    'exquisite-perception-staging-725a.up.railway.app',
    'localhost', 'localhost:8888', '127.0.0.1:5000',
    'training.miramarforklift.com',
    'miramarforklifttraining-production.up.railway.app.evil.com',
    'x.miramarforklifttraining-production.up.railway.app',
    undefined,
  ]) {
    assert.equal(resolveCanonicalHostRedirect(host, '/faq'), null, String(host));
  }
});

test('health-check paths are exempt on the old host', () => {
  for (const p of ['/health', '/healthz', '/api/health', '/api/health?probe=1', '/health/']) {
    assert.equal(resolveCanonicalHostRedirect(LEGACY_PRODUCTION_HOST, p), null, p);
  }
});

function fakeReq(host: string, url: string, method = 'GET') {
  return { headers: { host }, originalUrl: url, url, method } as any;
}
function fakeRes() {
  const r: any = { redirected: null as null | [number, string] };
  r.redirect = (status: number, loc: string) => { r.redirected = [status, loc]; };
  return r;
}

test('middleware: 301 on old host, next() elsewhere', () => {
  let nexted = 0;
  const res = fakeRes();
  canonicalHostMiddleware(fakeReq(LEGACY_PRODUCTION_HOST, '/p/x?a=1'), res, () => { nexted++; });
  assert.deepEqual(res.redirected, [301, 'https://training.miramarforklift.com/p/x?a=1']);
  assert.equal(nexted, 0);

  const res2 = fakeRes();
  canonicalHostMiddleware(fakeReq('exquisite-perception-staging-725a.up.railway.app', '/p/x'), res2, () => { nexted++; });
  assert.equal(res2.redirected, null);
  assert.equal(nexted, 1);

  const res3 = fakeRes();
  canonicalHostMiddleware(fakeReq(LEGACY_PRODUCTION_HOST, '/api/orders', 'POST'), res3, () => { nexted++; });
  assert.deepEqual(res3.redirected, [308, 'https://training.miramarforklift.com/api/orders']);
});

test('middleware is registered before routes/SSR/static in server/index.ts', () => {
  const src = readFileSync('server/index.ts', 'utf8');
  const at = src.indexOf('app.use(canonicalHostMiddleware)');
  assert.ok(at > 0);
  for (const later of ['registerRoutes(httpServer', 'registerSsrMiddleware(app)', 'serveStatic(app)', 'app.use(helmet(']) {
    assert.ok(src.indexOf(later) > at, `${later} should come after the host redirect`);
  }
});
