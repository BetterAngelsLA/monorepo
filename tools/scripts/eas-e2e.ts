/**
 * EAS E2E Trigger Script
 *
 * Orchestrates E2E test execution:
 *   1. Setup env and compute fingerprint (same as deploy pipeline)
 *   2. Ensure preview builds exist for this fingerprint (trigger if missing)
 *   3. Publish an EAS Update for the branch
 *   4. Trigger the EAS workflow with build IDs, update group, and build filter
 *      params (the workflow uses get-build with wait_for_in_progress to wait
 *      for builds to complete before running Maestro tests)
 *
 * Usage:
 *   npx ts-node tools/scripts/eas-e2e.ts --project betterangels
 *
 * Required env vars:
 *   EXPO_TOKEN   - EAS authentication token
 *   BRANCH_NAME  - Git branch name
 *
 * EXPO_PUBLIC_* secrets (for fingerprint computation):
 *   EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY
 *   EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY
 *   EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_IOS
 *   EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_ANDROID
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  EAS_ACCOUNT,
  argv,
  getEnv,
  getOptionalEnv,
  resolveProjectDir,
  resolveRuntime,
  run,
  runJson,
  setupEnv,
} from './eas-utils';

const project = argv.project as string | undefined;
if (!project) {
  console.error('Usage: eas-e2e.ts --project <name>');
  process.exit(1);
}

// Android APKs work on emulators directly; only iOS needs a simulator build
const androidProfile = 'preview';
const iosProfile = 'development-simulator';
const branch = getEnv('BRANCH_NAME');
const projectDir = resolveProjectDir(project);

// 1. Setup env once (it is identical across profiles). `copy-lockfile` comes
// next, before anything is resolved or looked up, because it rewrites the
// manifests the fingerprint hashes: `preview.yml` runs it before resolving the
// runtime, and a runtime computed from a different workspace state is a runtime
// no build ever produces.
setupEnv(projectDir, androidProfile);
run(`yarn nx run ${project}:copy-lockfile`);

// Resolve each platform's runtime separately: the fingerprints differ, and
// looking a build up with the other platform's hash always misses.
const androidRuntime = resolveRuntime(projectDir, 'android');
const iosRuntime = resolveRuntime(projectDir, 'ios');

// 2. Find or trigger builds for both platforms
console.log(
  `\nChecking for builds: android ${androidRuntime}, ios ${iosRuntime}`,
);

function findBuildId(
  platform: string,
  profile: string,
  runtime: string,
): string | undefined {
  // `find-build.mjs` is the same reuse rule the preview pipeline applies: a
  // fingerprint builds once, in any status, and never twice. It retries a failed
  // lookup and exits non-zero if EAS never answers, rather than reporting "no
  // build" and paying for a duplicate.
  const result = runJson<{ id: string | null }>(
    `node tools/scripts/find-build.mjs --project ${project} --platform ${platform} --profile ${profile} --runtime ${runtime} --json`,
  );
  return result.id ?? undefined;
}

let androidBuildId = findBuildId('android', androidProfile, androidRuntime);
let iosBuildId = findBuildId('ios', iosProfile, iosRuntime);

// Trigger missing builds separately (different profiles per platform). The
// `preview` configuration supplies the profile and runs the env/prebuild
// dependencies; the explicit --profile still wins for the simulator.
if (!androidBuildId) {
  console.log(
    `\nTriggering android build (profile: ${androidProfile}, --wait false)...`,
  );
  const newBuilds = runJson<Array<{ id: string; platform: string }>>(
    `yarn nx run ${project}:eas-build:preview --profile ${androidProfile} --platform android --freezeCredentials=true --json=true --wait=false`,
  );
  androidBuildId = newBuilds[0]?.id;
  console.log(`Triggered android build: ${androidBuildId}`);
}
if (!iosBuildId) {
  console.log(
    `\nTriggering ios build (profile: ${iosProfile}, --wait false)...`,
  );
  const newBuilds = runJson<Array<{ id: string; platform: string }>>(
    `yarn nx run ${project}:eas-build:preview --profile ${iosProfile} --platform ios --freezeCredentials=true --json=true --wait=false`,
  );
  iosBuildId = newBuilds[0]?.id;
  console.log(`Triggered ios build: ${iosBuildId}`);
}

if (!androidBuildId || !iosBuildId) {
  throw new Error('Failed to resolve build IDs for both platforms');
}

// 3. Publish update
console.log(`\nPublishing update on branch: ${branch}`);

// Inline EXPO_PUBLIC_E2E_MODE=1 into the published bundle so e2e-only
// runtime tweaks (e.g. hiding the expo-dev-menu "Tools" FAB) activate.
// EXPO_PUBLIC_* values are read by Metro from process.env at bundle
// time and statically inlined; the child `eas update` process inherits
// this env, which propagates to the bundler it spawns.
process.env['EXPO_PUBLIC_E2E_MODE'] = '1';

// `eas-update` is a run-commands target: it takes no CLI flags of its own — the
// branch comes from BRANCH_NAME (set by the workflow) and the machine-readable
// payload is what the script prints on stdout.
const updates = runJson<Array<{ group: string; platform: string }>>(
  `yarn nx run ${project}:eas-update:preview`,
);
const groupId = updates[0]?.group;
if (!groupId) {
  throw new Error('Failed to publish update — no group ID returned');
}
console.log(`Update group: ${groupId}`);

// 4. Write GitHub status metadata to .env.local so the EAS workflow can post
// commit statuses. `.env.local` (not the committed `.env`) so this never
// dirties a tracked file; EAS still uploads it because `.easignore` does not
// exclude it.
const githubRepository = getOptionalEnv('GITHUB_REPOSITORY');
const githubStatusSha = getOptionalEnv('GITHUB_STATUS_SHA');
const githubStatusContext = `eas/e2e/${project}`;
const envPath = path.join(projectDir, '.env.local');

if (githubRepository && githubStatusSha) {
  const statusVars = [
    `GITHUB_REPOSITORY=${githubRepository}`,
    `GITHUB_STATUS_SHA=${githubStatusSha}`,
    `GITHUB_STATUS_CONTEXT=${githubStatusContext}`,
    `EAS_ACCOUNT=${EAS_ACCOUNT}`,
    `EAS_PROJECT_SLUG=${project}`,
  ];
  fs.appendFileSync(envPath, statusVars.join('\n') + '\n');
  console.log(`\nWrote GitHub status metadata to .env.local`);
} else {
  console.log(
    '\nSkipping GitHub status metadata (GITHUB_REPOSITORY or GITHUB_STATUS_SHA not set)',
  );
}

// 5. Trigger EAS workflow with build IDs + update group + filter params for wait
console.log('\nTriggering EAS Maestro workflow...');
run(
  `npx eas workflow:run .eas/workflows/e2e-test.yml ` +
    `-F android_build_id=${androidBuildId} ` +
    `-F ios_build_id=${iosBuildId} ` +
    `-F update_group_id=${groupId} ` +
    `-F MAESTRO_BA_USER_EMAIL=${process.env.MAESTRO_BA_USER_EMAIL} ` +
    `-F MAESTRO_BA_USER_PASSWORD=${process.env.MAESTRO_BA_USER_PASSWORD} ` +
    `-F android_runtime_version=${androidRuntime} ` +
    `-F ios_runtime_version=${iosRuntime} ` +
    `-F android_profile=${androidProfile} ` +
    `-F ios_profile=${iosProfile} ` +
    `--non-interactive`,
  { cwd: projectDir },
);

console.log('\nE2E tests triggered on EAS');
