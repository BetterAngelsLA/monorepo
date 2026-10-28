#!/usr/bin/env node
/**
 * Write EXPO_WEB_BASE_URL into apps/betterangels/.env.local.
 *
 * @nx/expo:export has no `env` option; the Expo CLI reads .env.local. Writing it
 * here keeps the local and CI exports on the same branch path without copying the
 * path logic into the target.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('apps/betterangels/.env.local');
const baseUrl = execFileSync('node', ['tools/shared/print-base-path.mjs'], {
  encoding: 'utf8',
}).trim();

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
