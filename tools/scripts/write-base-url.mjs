#!/usr/bin/env node
/**
 * Write EXPO_WEB_BASE_URL into apps/betterangels/.env.local.
 *
 * @nx/expo:export has no `env` option; the Expo CLI reads .env.local. Writing it
 * here keeps the local and CI exports on the same branch path without copying the
 * path logic into the target.
 *
 * Only the web export may observe this value: it lands in `expoConfig`
 * (`experiments.baseUrl`), so once it is in the file, any native job that
 * evaluates `app.config.js` afterwards — `eas build`, `eas update` — fingerprints
 * a branch-scoped runtime version no binary carries. Native steps run first, or
 * re-pull `.env.local` (the preview mobile step does).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const envPath = process.env.BASE_URL_ENV_PATH
  ? path.resolve(process.env.BASE_URL_ENV_PATH)
  : path.resolve(import.meta.dirname, '../../apps/betterangels/.env.local');
const baseUrl = execFileSync(
  'node',
  [path.join(import.meta.dirname, '../shared/print-base-path.mjs')],
  {
    encoding: 'utf8',
  },
).trim();

let content = '';
try {
  content = fs.readFileSync(envPath, 'utf8');
} catch {
  // no local env yet
}

const lines = content
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('EXPO_WEB_BASE_URL='));
lines.push(`EXPO_WEB_BASE_URL=${baseUrl}`);
fs.writeFileSync(envPath, lines.join('\n') + '\n');
