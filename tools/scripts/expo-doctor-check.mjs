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
 *   3. Run expo-doctor (WITHOUT its dependency-version check, which fails on
 *      ANY mismatch) + run our own SDK version check with the repo policy
 *      (see expo-doctor-version-policy.mjs):
 *        - ❗ major mismatch   -> FAIL  (unexpected version drift)
 *        - ⚠️ minor / 🔧 patch / ➿ other -> WARN (usually "Expo shipped a
 *          new patch" — must not fail CI / the merge queue)
 *   4. Cleanup (restore original package.json)
 */
import { execSync } from 'child_process';
import { readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { resolveStarDeps } from './fill-star-deps.mjs';
import {
  parseInstallCheckJson,
  evaluateVersionPolicy,
  formatMismatchSections,
} from './expo-doctor-version-policy.mjs';

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

// Run a command and capture stdout, even when it exits non-zero.
// `expo install --check --json` exits 1 when deps are out of date (normal).
const runCapture = (cmd, opts = {}) => {
  try {
    return {
      status: 0,
      stdout: execSync(cmd, {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        ...opts,
      }).toString(),
      stderr: '',
    };
  } catch (e) {
    return {
      status: e.status ?? 1,
      stdout: String(e.stdout ?? ''),
      stderr: String(e.stderr ?? ''),
    };
  }
};

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

  // ---- 3. expo-doctor (all checks except the dependency-version check) ----

  group(`🩺 expo-doctor (${appName})`);
  try {
    run('npx -y expo-doctor', {
      cwd: appDir,
      env: { ...process.env, EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK: '1' },
    });
  } catch (e) {
    exitCode = e.status || 1;
  }
  endgroup();

  // ---- 4. SDK dependency-version check with the repo policy ----

  group(`🔢 SDK dependency versions (${appName})`);
  const check = runCapture('npx expo install --check --json', {
    cwd: appDir,
    env: { ...process.env, CI: '1', EXPO_DEBUG: '0' },
  });

  // status 0 = up to date; status 1 = out of date (expected, carries JSON).
  // Anything else means the check itself is broken — fail closed.
  if (check.status !== 0 && check.status !== 1) {
    console.error(
      `ERROR: 'npx expo install --check --json' failed with status ${check.status}.`,
    );
    if (check.stdout) console.error(check.stdout);
    if (check.stderr) console.error(check.stderr);
    exitCode = exitCode || 1;
  } else {
    try {
      const { mismatches } = parseInstallCheckJson(check.stdout);
      const { fail, warn: policyWarnings } = evaluateVersionPolicy(mismatches);

      if (policyWarnings.length) {
        console.warn(formatMismatchSections(policyWarnings));
        console.warn(
          'SDK dependencies are out of date (minor/patch). This is usually because Expo\n' +
            'shipped an update — not a PR regression — so CI does not fail on this.',
        );
        console.warn(
          '::warning::Expo SDK dependencies are out of date (minor/patch) — not failing CI.',
        );
        ok('SDK dependency versions reviewed (warnings only)');
      } else if (fail.length === 0) {
        ok('SDK dependency versions up to date');
      }

      if (fail.length) {
        console.error(formatMismatchSections(fail));
        console.error(
          'ERROR: unexpected major version drift vs the installed Expo SDK.\n' +
            "Run 'npx expo install --check' to review, or add intentional overrides to 'expo.install.exclude'.",
        );
        exitCode = exitCode || 1;
      }
    } catch (e) {
      console.error(
        `ERROR: could not evaluate SDK dependency versions: ${e.message}`,
      );
      exitCode = exitCode || 1;
    }
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
