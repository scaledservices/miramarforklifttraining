// 2026-09-28 weekly update (Alberto): pre-exam video, card-already-ordered
// false positive, company map, free shipping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COURSE_STEPS } from './course-content';
import { COURSE_STEPS_ES } from './course-content-es';
import { FORKLIFT_SAFETY_VIDEO } from './course-videos';
import { presentStep } from '../server/course-presentation';
import { youtubeIdFrom, creditWatch, watchedPercent, MAX_CREDIT_PER_TICK_S } from '../shared/video-watch';

const SLUG_EN = 'online-forklift-operator-certification';

test('required video sits directly before the final exam, EN and ES at the same index', () => {
  for (const [lang, steps] of [['en', COURSE_STEPS], ['es', COURSE_STEPS_ES]] as const) {
    const vi = steps.findIndex((s) => s.type === 'video');
    assert.ok(vi > 0, `${lang}: no video step`);
    assert.equal(steps[vi + 1].type, 'exam', `${lang}: video must be followed by the exam`);
    assert.ok(youtubeIdFrom(steps[vi].config.video_url), `${lang}: video_url is not a YouTube URL`);
    assert.ok(steps[vi].config.min_watch_percentage >= 80, `${lang}: watch threshold too low`);
  }
  assert.equal(COURSE_STEPS.length, COURSE_STEPS_ES.length);
  COURSE_STEPS.forEach((s, i) => assert.equal(s.type, COURSE_STEPS_ES[i].type, `type mismatch at ${i}`));
});

test('in-course language toggle swaps the video step to the Spanish config', () => {
  const vi = COURSE_STEPS.findIndex((s) => s.type === 'video');
  const shown = presentStep(SLUG_EN, { ...COURSE_STEPS[vi] }, 'es');
  assert.equal(shown.title, COURSE_STEPS_ES[vi].title);
  assert.equal(shown.config.video_url, FORKLIFT_SAFETY_VIDEO.es ?? FORKLIFT_SAFETY_VIDEO.en);
});

test('EN and ES courses use their own language videos', () => {
  assert.equal(youtubeIdFrom(FORKLIFT_SAFETY_VIDEO.en), 'aMdWwGJVXXQ');
  assert.equal(youtubeIdFrom(FORKLIFT_SAFETY_VIDEO.es), 'fGlG-WlMYQg');
  const vi = COURSE_STEPS.findIndex((s) => s.type === 'video');
  assert.equal(youtubeIdFrom(COURSE_STEPS[vi].config.video_url), 'aMdWwGJVXXQ');
  assert.equal(youtubeIdFrom(COURSE_STEPS_ES[vi].config.video_url), 'fGlG-WlMYQg');
});

test('YouTube id parsing handles every common URL form', () => {
  const id = 'aMdWwGJVXXQ';
  for (const u of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?feature=share&v=${id}&t=10`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://youtube.com/shorts/${id}`,
  ]) assert.equal(youtubeIdFrom(u), id, u);
  assert.equal(youtubeIdFrom('https://vimeo.com/123'), null);
  assert.equal(youtubeIdFrom(''), null);
});

test('seeking ahead earns no watch credit; real playback does', () => {
  let w = 0;
  w = creditWatch(w, 0, 1, true);        // normal second of playback
  assert.equal(w, 1);
  w = creditWatch(w, 1, 1500, true);     // scrubbed to the end
  assert.equal(w, 1);
  w = creditWatch(w, 1500, 1400, true);  // scrubbed back
  assert.equal(w, 1);
  w = creditWatch(w, 10, 11, false);     // paused
  assert.equal(w, 1);
  w = creditWatch(w, 20, 20 + MAX_CREDIT_PER_TICK_S, true);
  assert.equal(w, 1 + MAX_CREDIT_PER_TICK_S);
  assert.equal(watchedPercent(1484, 1649), 90);
  assert.equal(watchedPercent(5000, 1649), 100);
  assert.equal(watchedPercent(10, 0), 0);
});

test('CSP allows YouTube embeds + player API, and referrer is sent (OSM map tiles, YouTube Error 153)', () => {
  const s = readFileSync('server/index.ts', 'utf8');
  const frame = s.match(/frameSrc:\s*\[([^\]]*)\]/)![1];
  assert.ok(frame.includes('https://www.youtube-nocookie.com'));
  const script = s.match(/scriptSrc:\s*\[([^\]]*)\]/)![1];
  assert.ok(script.includes('https://www.youtube.com'));
  assert.match(s, /referrerPolicy:\s*\{\s*policy:\s*"strict-origin-when-cross-origin"/);
});

test('order confirmation is not replaced by "Card already ordered" after the order we just placed', () => {
  const s = readFileSync('client/src/pages/OrderCertCard.tsx', 'utf8');
  assert.match(s, /if \(existingCardOrder && !justOrdered\)/);
  assert.equal((s.match(/setJustOrdered\(true\)/g) || []).length, 2, 'both pay-now and prepaid success paths');
  assert.match(s, /setUsedEntitlement\(prepaidEntitlement\)/);
});

test('free shipping, no expedited option offered', () => {
  for (const lang of ['en', 'es']) {
    const j = JSON.parse(readFileSync(`client/src/locales/${lang}/common.json`, 'utf8'));
    assert.match(j.orderCertCard.freeShippingLine, /4-5/);
    for (const k of ['videoWatched', 'videoRequired', 'videoContinue', 'videoKeepWatching']) assert.ok(j.lms[k], `${lang} lms.${k}`);
  }
  const dlg = readFileSync('client/src/components/group/OrderPhotoIdDialog.tsx', 'utf8');
  assert.ok(!dlg.includes('value="expedited"'), 'expedited radio must be gone');
});

test('seeder refresh never repurposes a row to a different step type', () => {
  const s = readFileSync('scripts/seed-online-courses.ts', 'utf8');
  assert.match(s, /s\.title === def\.title && s\.type === def\.type/);
  assert.match(s, /s\.stepOrder === i \+ 1 && s\.type === def\.type/);
  assert.match(s, /db\.transaction/);
});

test('no PII debug logging left in certificate routes', () => {
  assert.ok(!readFileSync('server/routes/certs.ts', 'utf8').includes('[CertDebug]'));
});
