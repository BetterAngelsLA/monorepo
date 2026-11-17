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
import path from 'node:path';
import minimist from 'minimist';

import { isDeadBuild } from './build-rank.mjs';
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

// `@nx/expo:build-list` resolves on its first stdout chunk and kills the child,
// so a build list larger than that chunk is truncated. Call eas directly.
const projectDir = path.resolve(process.cwd(), 'apps', project);
const easOptions = {
  cwd: projectDir,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
  // 50 builds with signed URLs is a few hundred KB; fail loudly rather than
  // let a future output-size change truncate again.
  maxBuffer: 10 * 1024 * 1024,
};
const listBuilds = (extraArgs) =>
  parseBuilds(
    execFileSync(
      'eas',
      [
        'build:list',
        '--platform',
        platform,
        '--build-profile',
        profile,
        // The runtime is the fingerprint hash under the fingerprint policy.
        '--fingerprint-hash',
        runtime,
        '--json',
        '--non-interactive',
        ...extraArgs,
      ],
      easOptions,
    ),
  );

let lastError;
for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
    // The fingerprint is supposed to build once. Ask for its newest build and
    // let the status decide: finished/live -> reuse, dead -> fail, none -> queue.
    // One request with --limit 1 keeps the payload small; do not scan history.
    const builds = listBuilds(['--limit', '1']);
    if (builds.length === 0) {
      console.error(`No ${platform} build for ${profile}/${runtime}.`);
      console.log(argv.json ? JSON.stringify({ id: null }) : '');
      process.exit(0);
    }
    const build = builds[0];
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
