#!/usr/bin/env node
/**
 * Push the pipeline env into the EAS environment for a profile.
 *
 *   node tools/scripts/sync-eas-env.mjs --project <name> \
 *     --environment <development|production> [--path <file>] [--force]
 *
 * EAS resolves `app.config.js` on its own side, where only the eas.json profile
 * vars and the EAS environment exist — and the fingerprint depends on that
 * config, so the two sides have to agree. This is what makes them agree; a
 * `.env.local` in the upload is not relied on.
 *
 * Reads what EAS already has and pushes only when a variable is missing, so a
 * value edited in the dashboard survives. `--force` is the deliberate path for
 * rotating a secret.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'path';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const { project, environment } = argv;

if (!project || !environment) {
  console.error(
    'Usage: sync-eas-env.mjs --project <name> --environment <development|production> [--path <file>] [--force]',
  );
  process.exit(2);
}
if (!process.env.EXPO_TOKEN) {
  console.error('EXPO_TOKEN is required to read or write the EAS environment.');
  process.exit(1);
}

const projectDir = resolve(process.cwd(), 'apps', project);
const envPath = resolve(argv.path ?? resolve(projectDir, '.env.local'));
if (!existsSync(envPath)) {
  console.error(
    `No ${envPath}; run write-eas-env first (it is a dependency of this target).`,
  );
  process.exit(1);
}

const local = readFileSync(envPath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.slice(0, line.indexOf('=')))
  .filter(Boolean);

const force = Boolean(argv.force) || process.env.FORCE_EAS_ENV_SYNC === 'true';
// Absolute: `eas env:push` resolves a relative path from the project directory,
// and the env file can live outside it (CI writes it to the temp dir).
const pathForCli = envPath;

// One push per job: `.env.local` is written by `write-eas-env`, and both
// `eas-build` and `eas-update` depend on this target, so without a marker the
// same content is pushed twice per pipeline run. Temp dir, not the repo: it must
// not show up as a workspace change.
const content = readFileSync(envPath, 'utf8');
const contentHash = createHash('sha256').update(content).digest('hex').slice(0, 16);
const job = `${process.env.GITHUB_RUN_ID ?? 'local'}-${process.env.GITHUB_JOB ?? 'job'}`;
const marker = resolve(
  tmpdir(),
  `eas-env-synced-${project}-${environment}-${job}`,
);
if (
  !force &&
  existsSync(marker) &&
  readFileSync(marker, 'utf8').trim() === contentHash
) {
  console.log(
    `Already pushed ${envPath} to ${environment} in this job; skipping.`,
  );
  process.exit(0);
}

const localEas = resolve(process.cwd(), 'node_modules/.bin/eas');
const eas = existsSync(localEas) ? localEas : 'eas';
const run = (args) =>
  execFileSync(eas, args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

// `env:list` has no --json (eas-cli 24.8), so parse the long, block-per-var
// format. A parse that finds no names falls through to pushing: the old
// behaviour is the safe default when we cannot read the remote state.
let remoteNames = new Set();
try {
  const output = run([
    'env:list',
    '--environment',
    environment,
    '--format',
    'long',
  ]);
  for (const match of output.matchAll(/^Name\s+(\S+)\s*$/gm)) {
    remoteNames.add(match[1]);
  }
} catch (error) {
  console.error(
    `Could not list the ${environment} environment; pushing as a fallback: ${
      error?.stderr?.toString().trim() || error?.message
    }`,
  );
}

const missing = local.filter((name) => !remoteNames.has(name));
console.log(
  `EAS ${environment} environment: ${remoteNames.size} vars; ${envPath}: ${local.length} vars.`,
);
if (remoteNames.size === 0) {
  console.log(
    'Could not read any var names back (robot token, or env:list output changed); pushing to be safe.',
  );
}

if (!force && remoteNames.size > 0 && missing.length === 0) {
  console.log(
    'EAS already has every var; skipping env:push (use --force to rotate).',
  );
  process.exit(0);
}

if (force) {
  console.log('--force: pushing every var regardless of what EAS has.');
} else if (remoteNames.size > 0) {
  console.log(`Pushing ${missing.length} missing var(s): ${missing.join(', ')}`);
}

run([
  'env:push',
  '--environment',
  environment,
  '--path',
  pathForCli,
  '--force',
]);
writeFileSync(marker, contentHash + '\n');
console.log(`Pushed ${envPath} to the ${environment} environment.`);
