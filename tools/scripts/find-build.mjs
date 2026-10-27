#!/usr/bin/env node
/**
 * Print the build that already exists for a fingerprint, or `{"id":null}`.
 *
 * With `--json` the whole build is printed, not just its id: callers render its
 * distribution, app version and commit, and re-deriving those downstream only
 * loses them.
 *
 *   node tools/scripts/find-build.mjs --project <name> --platform <p> \
 *     --profile <profile> --runtime <hash> [--json] [--force]
 *
 * Status is ignored: a fingerprint builds once. `--force` (or FORCE_EAS_BUILD)
 * is the way past a build that failed for a reason that has since been fixed.
 * Exits 1 rather than reporting "no build" when `build:list` never succeeds, so
 * an EAS outage cannot silently queue a duplicate.
 */
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import minimist from 'minimist';

import { bestBuild, isDeadBuild } from './build-rank.mjs';
import { parseJsonOutput } from './cli-json.mjs';

const argv = minimist(process.argv.slice(2));
const { platform, profile, runtime, project } = argv;

if (!platform || !profile || !runtime) {
  console.error(
    'Usage: find-build.mjs --platform <p> --profile <profile> --runtime <hash> [--project <name>] [--json] [--attempts 3]',
  );
  process.exit(2);
}

const attempts = Number(argv.attempts ?? 3);

// `--force` (or FORCE_EAS_BUILD, which the workflow sets from its label) says
// "build even though one exists" — the way out when a fingerprint is poisoned by
// a build that failed for a cause we have since fixed.
if (argv.force || process.env.FORCE_EAS_BUILD === 'true') {
  console.error(
    `force-eas-build: ignoring existing ${platform} builds for ${profile}.`,
  );
  console.log(argv.json ? JSON.stringify({ id: null }) : '');
  process.exit(0);
}

const parseBuilds = (raw) => {
  const builds = parseJsonOutput(raw);
  if (!Array.isArray(builds))
    throw new Error('build:list did not return an array');
  return builds;
};

const cwd = project ? resolve(process.cwd(), 'apps', project) : process.cwd();
const localEas = resolve(process.cwd(), 'node_modules/.bin/eas');
const eas = existsSync(localEas) ? localEas : 'eas';

const args = [
  'build:list',
  '--platform',
  platform,
  '--build-profile',
  profile,
  '--runtime-version',
  runtime,
  '--limit',
  // Enough to see past a canceled duplicate to the build that actually exists.
  '10',
  '--json',
  '--non-interactive',
];

let lastError;
for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
    const raw = execFileSync(eas, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    const builds = parseBuilds(raw);
    if (builds.length === 0) {
      console.error(`No ${platform} build for ${profile}/${runtime}.`);
      console.log(argv.json ? JSON.stringify({ id: null }) : '');
      process.exit(0);
    }
    const build = bestBuild(builds) ?? {};
    const { id, status } = build;
    console.error(
      `Found ${platform} build ${id} for ${profile}/${runtime} (status: ${status ?? '?'}).`,
    );
    if (isDeadBuild(status)) {
      // Reused on purpose: a failed fingerprint is not retried (that is how the
      // old pipeline burned money), so say what this means rather than leaving a
      // caller to discover it. `force-eas-build` is the way out.
      console.error(
        `⚠️  That build is ${status}: this fingerprint has no usable ${platform} binary. ` +
          `Re-run with the force-eas-build label to build it again.`,
      );
    }
    console.log(argv.json ? JSON.stringify(build) : id);
    process.exit(0);
  } catch (error) {
    lastError = error;
    const detail =
      error?.stderr?.toString().trim() || error?.message || 'unknown error';
    console.error(
      `build:list failed for ${platform}/${profile} (attempt ${attempt}/${attempts}): ${detail}`,
    );
    if (attempt < attempts) {
      // Synchronous sleep keeps the script a single linear flow.
      execFileSync('sleep', [String(attempt * 2)], { stdio: 'ignore' });
    }
  }
}

console.error(
  `Could not determine whether a ${platform} build exists for ${runtime}; refusing to queue a duplicate.`,
  lastError?.message ?? '',
);
process.exit(1);
