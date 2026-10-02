// Go-live hardening (2026-10-01): live-payment boot guards, session fixation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { presentStep } from '../server/course-presentation';
import { COURSE_STEPS } from './course-content';
import { COURSE_STEPS_ES } from './course-content-es';

test('every login path regenerates the session (no direct userId assignment)', () => {
  const auth = readFileSync('server/routes/auth.ts', 'utf8');
  assert.ok(!/req\.session\.userId\s*=/.test(auth), 'auth.ts must log in via establishSession');
  assert.equal((auth.match(/await establishSession\(req, user\.id\)/g) || []).length, 5, 'register, password login, 3 OAuth callbacks');
  const mw = readFileSync('server/routes/middleware.ts', 'utf8');
  assert.match(mw, /req\.session\.regenerate\(/);
});

test('QA account switcher can never be registered while live payments are on', () => {
  const auth = readFileSync('server/routes/auth.ts', 'utf8');
  assert.match(auth, /process\.env\.AUTHORIZE_ENVIRONMENT !== "production" && \(process\.env\.NODE_ENV !== "production" \|\| process\.env\.ENABLE_QA_ACCOUNT_SWITCHER === "true"\)/);
});

// Boot the real server entry with production env and assert it refuses to
// start (exit 1 + FATAL) before touching the DB or binding a port.
function boot(env: Record<string, string>) {
  return spawnSync(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: { PATH: process.env.PATH!, HOME: process.env.HOME!, NODE_ENV: 'production', DATABASE_URL: 'postgres://127.0.0.1:1/none', SESSION_SECRET: 'x', TOKEN_HMAC_SECRET: 'x', PORT: '0', ...env },
    encoding: 'utf8',
    timeout: 60_000,
  });
}

test('boot refuses a mistyped AUTHORIZE_ENVIRONMENT (would silently use sandbox)', () => {
  const r = boot({ AUTHORIZE_ENVIRONMENT: 'prod' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr + r.stdout, /FATAL: AUTHORIZE_ENVIRONMENT must be "sandbox" or "production"/);
});

test('boot refuses the QA switcher together with live payments', () => {
  const r = boot({ AUTHORIZE_ENVIRONMENT: 'production', ENABLE_QA_ACCOUNT_SWITCHER: 'true' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr + r.stdout, /FATAL: ENABLE_QA_ACCOUNT_SWITCHER=true is not allowed with AUTHORIZE_ENVIRONMENT=production/);
});

test('course sidebar gets the real localized module from content, not a title guess', () => {
  COURSE_STEPS.forEach((step, i) => {
    const es = presentStep('online-forklift-operator-certification', { ...step }, 'es') as any;
    assert.equal(es.module, COURSE_STEPS_ES[i].module, `ES module at step ${i + 1}`);
    const en = presentStep('online-forklift-operator-certification', { ...step }, 'en') as any;
    assert.equal(en.module, step.module, `EN module at step ${i + 1}`);
  });
  assert.match(readFileSync('client/src/pages/CoursePlayer.tsx', 'utf8'), /const serverModule = \(step as \{ module\?: string \}\)\.module;\n\s*if \(serverModule\) return serverModule;/);
});
