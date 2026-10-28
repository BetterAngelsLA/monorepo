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
 * Status is not filtered out here: a fingerprint builds once, and a dead build is
 * reported rather than treated as "no build" — `eas-builds.ts` turns it into a
 * failure. `--force` (or FORCE_EAS_BUILD) is the way past a build that failed
 * for a reason that has since been fixed. Exits 1 rather than reporting
 * "no build" when `build:list` never succeeds, so an EAS outage cannot silently
 * queue a duplicate.
 */
import { execFileSync } from 'child_process';
import minimist from 'minimist';

import { bestBuild, isDeadBuild } from './build-rank.mjs';
import { parseJsonOutput } from './cli-json.mjs';

const argv = minimist(process.argv.slice(2));
const { platform, profile, runtime, project } = argv;

if (!project || !platform || !profile || !runtime) {
  console.error(
    'Usage: find-build.mjs --project <name> --platform <p> --profile <profile> --runtime <hash> [--json] [--attempts 3]',
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

const cwd = process.cwd();

const args = [
  'run',
  `${project}:build-list`,
  '--platform',
  platform,
  '--buildProfile',
  profile,
  '--runtimeVersion',
  runtime,
  '--limit',
  // eas-cli caps this at 50; still deep enough to see past canceled/errored
  // duplicates to a FINISHED build, since `bestBuild` prefers a finished one.
  '50',
  '--json',
  '--interactive=false',
];

let lastError;
for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
    const raw = execFileSync('nx', args, {
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
      // Not "no build": the fingerprint is taken and has no binary. Failing here
      // keeps the rule in one place — `eas-builds.ts` just propagates this.
      console.error(
        `The existing ${platform}/${profile} build ${id} is ${status}; re-run ` +
          `with the force-eas-build label (PR) or the force-eas-build workflow ` +
          `input to rebuild fingerprint ${runtime}.`,
      );
      process.exit(1);
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
