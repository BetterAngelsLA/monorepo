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

// 2. Find or trigger builds for both platforms
console.log(`\nChecking for builds with runtime version: ${fingerprint}`);

function findBuildId(platform: string): string | undefined {
  try {
    const builds = runJson<Array<{ id: string; status: string }>>(
      `yarn nx run ${project}:build-list --platform ${platform} --buildProfile ${profile} --runtimeVersion ${fingerprint} --limit 1 --json --interactive false`
    );
    if (builds.length > 0) {
      console.log(`Found existing ${platform} build: ${builds[0].id} (${builds[0].status})`);
      return builds[0].id;
    }
  } catch {
    // no builds found
  }
  return undefined;
}

let androidBuildId = findBuildId('android');
let iosBuildId = findBuildId('ios');

// Trigger missing builds — use --platform all if both missing, otherwise single
const missingPlatforms = [
  ...(!androidBuildId ? ['android'] : []),
  ...(!iosBuildId ? ['ios'] : []),
];

if (missingPlatforms.length > 0) {
  const platformArg = missingPlatforms.length === 2 ? 'all' : missingPlatforms[0];
  console.log(`\nTriggering ${platformArg} build(s) (--wait false)...`);
  const newBuilds = runJson<Array<{ id: string; platform: string }>>(
    `yarn nx run ${project}:eas-build --profile ${profile} --platform ${platformArg} --freeze-credentials --interactive false --wait false --json`
  );
  for (const b of newBuilds) {
    console.log(`Triggered ${b.platform} build: ${b.id}`);
    if (b.platform.toLowerCase() === 'android') androidBuildId = b.id;
    if (b.platform.toLowerCase() === 'ios') iosBuildId = b.id;
  }
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

// 4. Trigger EAS workflow with build IDs + update group
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
