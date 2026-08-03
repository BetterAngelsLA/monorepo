#!/usr/bin/env node
/**
 * Validates Expo dependencies in CI.
 *
 * Usage: node tools/scripts/expo-doctor-check.mjs <app-dir>
 *   e.g. node tools/scripts/expo-doctor-check.mjs apps/betterangels
 *
 * Pipeline:
 *   1. Snapshot package.json → run sync-deps → fail if changed
 *   2. Fill star deps (* → real versions from root)
 *   3. Run expo-doctor from app directory
 *   4. Cleanup (restore original package.json)
 */
import { execSync } from 'child_process';
import { copyFileSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveStarDeps } from './fill-star-deps.mjs';

// --- helpers ---

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const group = (label) => console.log(`::group::${label}`);
const endgroup = () => console.log('::endgroup::');
const ok = (msg) => console.log(`  ✓ ${msg}`);
const err = (msg) => {
  console.error(msg);
  process.exit(1);
};

// Wraps execSync to always use ROOT_DIR and inherit stdio for visibility
const run = (cmd, opts = {}) =>
  execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit', ...opts });

// --- main ---

const appRel = process.argv[2];
if (!appRel) err('Usage: node tools/scripts/expo-doctor-check.mjs <app-dir>');

const appDir = resolve(ROOT_DIR, appRel);
const appName = appRel.split('/').pop();
const appPkgPath = resolve(appDir, 'package.json');

// ---- 1. sync-deps check ----

group(`🔍 sync-deps check (${appName})`);
const snapshot = readFileSync(appPkgPath, 'utf-8');
run(`yarn nx run ${appName}:sync-deps --skip-nx-cache`);
if (readFileSync(appPkgPath, 'utf-8') !== snapshot) {
  err(
    `ERROR: sync-deps modified ${appRel}/package.json!\n` +
      `Dependencies are out of sync. Run 'yarn nx run ${appName}:sync-deps' locally and commit.`,
  );
}
ok('Package deps in sync');
endgroup();

// ---- 2. fill star deps ----

group(`📦 fill-star-deps (${appName})`);
const originalPkg = readFileSync(appPkgPath, 'utf-8');

let exitCode = 0;
try {
  const { unresolved } = resolveStarDeps(ROOT_DIR, appDir);
  endgroup();

  // ---- 3. expo-doctor ----

  group(`🩺 expo-doctor (${appName})`);
  try {
    run('npx -y expo-doctor', { cwd: appDir });
  } catch (e) {
    exitCode = e.status || 1;
  }
  endgroup();
} finally {
  // ---- cleanup: always restore ----
  writeFileSync(appPkgPath, originalPkg);
  // Remove lockfile if filled-star-deps copied it into the app dir
  try {
    rmSync(resolve(appDir, 'yarn.lock'));
  } catch {}
  ok('Restored original package.json');
}

process.exit(exitCode);
