import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const app = path.resolve(import.meta.dirname, '../../apps/betterangels');

test('ios runtime version is stable', () => {
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
  assert.match(
    out,
    /"runtimeVersion":"585bc0b3954fbb19131e773165c8d25af11d8068"/,
    'runtime version changed; a build/update pair is required',
  );
});
