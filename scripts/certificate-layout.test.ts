import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('certificate uses supplied images, not a simulated signature', () => {
  const file = 'server/certificate-template.ts';
  assert.ok(existsSync(file), 'PDF layout must be independently renderable without database writes');
  const source = readFileSync(file, 'utf8');
  assert.match(source, /alberto-signature\.png/);
  assert.match(source, /osha-compliant\.png/);
  assert.doesNotMatch(source, /GreatVibes/);
  assert.ok(existsSync('client/public/images/alberto-signature.png'));
  assert.ok(existsSync('client/public/images/osha-compliant.png'));
});
