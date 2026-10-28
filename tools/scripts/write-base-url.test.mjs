import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repo = path.resolve(import.meta.dirname, '../..');
const script = path.join(repo, 'tools/scripts/write-base-url.mjs');

test('writes EXPO_WEB_BASE_URL and replaces an existing value', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'base-url-'));
  const envPath = path.join(dir, 'apps/betterangels/.env.local');
  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(
    envPath,
    'EXPO_PUBLIC_API_URL=https://api.example\nEXPO_WEB_BASE_URL=/stale\n',
  );

  execFileSync(process.execPath, [script], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: 'true',
      BRANCH_NAME: 'test-branch',
      BASE_URL_ENV_PATH: envPath,
    },
  });

  const content = fs.readFileSync(envPath, 'utf8');
  const baseUrls = content
    .split('\n')
    .filter((line) => line.startsWith('EXPO_WEB_BASE_URL='));
  assert.equal(baseUrls.length, 1, 'exactly one EXPO_WEB_BASE_URL');
  assert.ok(
    !content.includes('EXPO_WEB_BASE_URL=/stale'),
    'stale value replaced',
  );
  assert.equal(baseUrls[0], 'EXPO_WEB_BASE_URL=/branches/test-branch');
  assert.ok(
    content.includes('EXPO_PUBLIC_API_URL=https://api.example'),
    'keeps other vars',
  );
  fs.rmSync(dir, { recursive: true, force: true });
});
