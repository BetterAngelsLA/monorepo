/**
 * EAS E2E Trigger Script
 *
 * Orchestrates E2E test execution:
 *   1. Setup env and compute fingerprint (same as deploy pipeline)
 *   2. Find existing preview builds matching the fingerprint
 *   3. Publish an EAS Update for the branch
 *   4. Trigger the EAS Maestro workflow with build IDs + update group
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

import {
  argv,
  getEnv,
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

const profile = 'preview';
const branch = getEnv('BRANCH_NAME');
const projectDir = resolveProjectDir(project);

// 1. Setup env and compute fingerprint
const fingerprint = setupEnvAndFingerprint(projectDir, profile);

// 2. Find or trigger builds for this fingerprint
function findOrTriggerBuild(platform: string): string {
  console.log(
    `\nLooking for ${platform} build with runtime version: ${fingerprint}`
  );

  let builds: Array<{ id: string }> = [];
  try {
    builds = runJson<Array<{ id: string }>>(
      `yarn nx run ${project}:build-list --platform ${platform} --buildProfile ${profile} --runtimeVersion ${fingerprint} --limit 1 --json --interactive false`
    );
  } catch {
    // no builds found
  }

  if (builds.length > 0) {
    console.log(`Found existing ${platform} build: ${builds[0].id}`);
    return builds[0].id;
  }

  console.log(
    `No existing ${platform} build for runtime ${fingerprint}. Starting new build...`
  );
  const newBuilds = runJson<Array<{ id: string }>>(
    `yarn nx run ${project}:eas-build --profile ${profile} --platform ${platform} --freeze-credentials --interactive false --wait false --json`
  );
  console.log(`Started ${platform} build: ${newBuilds[0].id}`);
  return newBuilds[0].id;
}

const androidBuildId = findOrTriggerBuild('android');
const iosBuildId = findOrTriggerBuild('ios');

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

// 4. Trigger EAS Maestro workflow
console.log('\nTriggering EAS Maestro workflow...');
run(
  `npx eas-cli workflow:run .eas/workflows/e2e-test.yml ` +
    `-F android_build_id=${androidBuildId} ` +
    `-F ios_build_id=${iosBuildId} ` +
    `-F update_group_id=${groupId} ` +
    `--non-interactive`,
  { cwd: projectDir }
);

console.log('\nE2E tests triggered on EAS');
