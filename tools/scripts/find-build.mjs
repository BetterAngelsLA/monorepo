#!/usr/bin/env node
/**
 * Find the build that already exists for a fingerprint.
 *
 * Usage:
 *   node tools/scripts/find-build.mjs --project betterangels \
 *     --platform android --profile preview --runtime <hash> [--json]
 *
 * This is the single implementation of "has this fingerprint been built
 * already", shared by `preview.yml` and `tools/scripts/eas-e2e.ts`, so both
 * cannot drift apart.
 *
 * Status is deliberately ignored: the fingerprint *is* the identity of a build,
 * so a fingerprint that exists in any state — queued, finished, or failed — is
 * not built again. Paying twice for the same inputs buys nothing, and an update
 * only needs the runtime its binary will ship with. `preview.yml` exposes the
 * `force-eas-build` label as the way out once the cause of a failure is fixed.
 *
 * Output contract:
 *   stdout  the build id, or an empty line when there is none (--json: {"id"})
 *   stderr  the reasoning, so the CI log explains the decision
 *   exit 0  a definite answer (including "no build")
 *   exit 1  the lookup never succeeded — the caller must not guess
 *
 * The distinction between "no build" and "could not ask" matters: treating a
 * transient EAS error as "no build" queues a duplicate build, which is exactly
 * the spend this script exists to prevent. Retries absorb a blip; a lookup that
 * keeps failing reports failure and stops the pipeline instead.
 */
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import minimist from 'minimist';

import { bestBuild, isDeadBuild } from './build-rank.mjs';

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

// EAS prints notices ("eas-cli is now available") ahead of the JSON payload.
const parseBuilds = (raw) => {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('no JSON array in output');
  const builds = JSON.parse(raw.slice(start, end + 1));
  if (!Array.isArray(builds)) throw new Error('output is not an array');
  return builds;
};

const cwd = project
  ? resolve(process.cwd(), 'apps', project)
  : process.cwd();
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
    const { id, status } = bestBuild(builds) ?? {};
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
    console.log(argv.json ? JSON.stringify({ id }) : id);
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
