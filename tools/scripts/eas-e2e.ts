/**
 * EAS E2E Trigger Script
 *
 * Orchestrates E2E test execution:
 *   1. Setup env and compute fingerprint (same as deploy pipeline)
 *   2. Ensure preview builds exist for this fingerprint (trigger if missing)
 *   3. Publish an EAS Update for the branch
 *   4. Trigger the EAS workflow with fingerprint + update group
 *      (EAS workflow uses get-build with wait_for_in_progress to wait for builds)
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
  run,
  runJson,
  setupEnvAndFingerprint,
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

// 1. Setup env and compute fingerprint (env vars are identical across profiles)
const fingerprint = setupEnvAndFingerprint(projectDir, androidProfile);

// 2. Find or trigger builds for both platforms
console.log(`\nChecking for builds with runtime version: ${fingerprint}`);

function findBuildId(platform: string, profile: string): string | undefined {
  try {
    const builds = runJson<Array<{ id: string; status: string }>>(
      `yarn nx run ${project}:build-list --platform ${platform} --buildProfile ${profile} --runtimeVersion ${fingerprint} --limit 1 --json --interactive false`
    );
    if (builds.length > 0) {
      console.log(
        `Found existing ${platform} build: ${builds[0].id} (${builds[0].status})`
      );
      return builds[0].id;
    }
  } catch {
    // no builds found
  }
  return undefined;
}

let androidBuildId = findBuildId('android', androidProfile);
let iosBuildId = findBuildId('ios', iosProfile);

// Trigger missing builds separately (different profiles per platform)
if (!androidBuildId) {
  console.log(
    `\nTriggering android build (profile: ${androidProfile}, --wait false)...`
  );
  const newBuilds = runJson<Array<{ id: string; platform: string }>>(
    `yarn nx run ${project}:eas-build --profile ${androidProfile} --platform android --freeze-credentials --interactive false --wait false --json`
  );
  androidBuildId = newBuilds[0]?.id;
  console.log(`Triggered android build: ${androidBuildId}`);
}
if (!iosBuildId) {
  console.log(
    `\nTriggering ios build (profile: ${iosProfile}, --wait false)...`
  );
  const newBuilds = runJson<Array<{ id: string; platform: string }>>(
    `yarn nx run ${project}:eas-build --profile ${iosProfile} --platform ios --freeze-credentials --interactive false --wait false --json`
  );
  iosBuildId = newBuilds[0]?.id;
  console.log(`Triggered ios build: ${iosBuildId}`);
}

if (!androidBuildId || !iosBuildId) {
  throw new Error('Failed to resolve build IDs for both platforms');
}

// 3. Publish update
console.log(`\nPublishing update on branch: ${branch}`);

const updates = runJson<Array<{ group: string; platform: string }>>(
  `yarn nx run ${project}:eas-update --branch "${branch}" --auto --json --interactive false`
);
const groupId = updates[0]?.group;
if (!groupId) {
  throw new Error('Failed to publish update — no group ID returned');
}
console.log(`Update group: ${groupId}`);

// 4. Write GitHub status metadata to .env so the EAS workflow can post commit statuses
const githubRepository = getOptionalEnv('GITHUB_REPOSITORY');
const githubStatusSha = getOptionalEnv('GITHUB_STATUS_SHA');
const githubStatusContext = `eas/e2e/${project}`;
const envPath = path.join(projectDir, '.env');

if (githubRepository && githubStatusSha) {
  const statusVars = [
    `GITHUB_REPOSITORY=${githubRepository}`,
    `GITHUB_STATUS_SHA=${githubStatusSha}`,
    `GITHUB_STATUS_CONTEXT=${githubStatusContext}`,
    `EAS_ACCOUNT=${EAS_ACCOUNT}`,
    `EAS_PROJECT_SLUG=${project}`,
  ];
  fs.appendFileSync(envPath, statusVars.join('\n') + '\n');
  console.log(`\nWrote GitHub status metadata to .env`);
} else {
  console.log(
    '\nSkipping GitHub status metadata (GITHUB_REPOSITORY or GITHUB_STATUS_SHA not set)'
  );
}

// 5. Trigger EAS workflow with build IDs + update group
console.log('\nTriggering EAS Maestro workflow...');
run(
  `npx eas workflow:run .eas/workflows/e2e-test.yml ` +
    `-F android_build_id=${androidBuildId} ` +
    `-F ios_build_id=${iosBuildId} ` +
    `-F update_group_id=${groupId} ` +
    `--non-interactive`,
  { cwd: projectDir }
);

console.log('\nE2E tests triggered on EAS');
