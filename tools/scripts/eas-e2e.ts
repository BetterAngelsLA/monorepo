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

// 2. Ensure builds exist for this fingerprint (trigger if missing, don't wait)
function ensureBuildExists(platform: string): void {
  console.log(
    `\nChecking for ${platform} build with runtime version: ${fingerprint}`
  );

  let builds: Array<{ id: string; status: string }> = [];
  try {
    builds = runJson<Array<{ id: string; status: string }>>(
      `yarn nx run ${project}:build-list --platform ${platform} --buildProfile ${profile} --runtimeVersion ${fingerprint} --limit 1 --json --interactive false`
    );
  } catch {
    // no builds found
  }

  if (builds.length > 0) {
    console.log(`Found existing ${platform} build: ${builds[0].id} (${builds[0].status})`);
    return;
  }

  console.log(
    `No ${platform} build for runtime ${fingerprint}. Triggering build...`
  );
  const newBuilds = runJson<Array<{ id: string }>>(
    `yarn nx run ${project}:eas-build --profile ${profile} --platform ${platform} --freeze-credentials --interactive false --wait false --json`
  );
  console.log(`Triggered ${platform} build: ${newBuilds[0].id} (EAS workflow will wait for it)`);
}

ensureBuildExists('android');
ensureBuildExists('ios');

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

// 4. Trigger EAS workflow — it uses get-build with wait_for_in_progress
console.log('\nTriggering EAS Maestro workflow...');
run(
  `npx eas-cli workflow:run .eas/workflows/e2e-test.yml ` +
    `-F fingerprint_hash=${fingerprint} ` +
    `-F update_group_id=${groupId} ` +
    `--non-interactive`,
  { cwd: projectDir }
);

console.log('\nE2E tests triggered on EAS (builds will be awaited there)');

console.log('\nE2E tests triggered on EAS');
