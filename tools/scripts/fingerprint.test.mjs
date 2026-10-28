import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const app = path.resolve(import.meta.dirname, '../../apps/betterangels');
const config = path.join(app, 'app.config.js');

function runtimeVersion() {
  const out = execFileSync(
    'npx',
    [
      'expo-updates',
      'runtimeversion:resolve',
      '--platform',
      'ios',
      '--workflow',
      'generic',
    ],
    { cwd: app, encoding: 'utf8' },
  );
  const match = out.match(/"runtimeVersion":"([a-f0-9]+)"/);
  assert.ok(match, 'runtime version not found in expo-updates output');
  return match[1];
}

// Compare against origin/main under the same ambient env: a hardcoded hash is
// environment-dependent (CI's .env.local comes from eas env:pull), while the
// question is only whether this branch changed the fingerprint.
test('runtime version matches origin/main', () => {
  const current = runtimeVersion();
  const base = execFileSync(
    'git',
    ['show', 'origin/main:apps/betterangels/app.config.js'],
    { cwd: app, encoding: 'utf8' },
  );
  const backup = fs.readFileSync(config, 'utf8');
  fs.writeFileSync(config, base);
  try {
    assert.equal(
      current,
      runtimeVersion(),
      'runtime version changed; a build/update pair is required',
    );
  } finally {
    fs.writeFileSync(config, backup);
  }
});
