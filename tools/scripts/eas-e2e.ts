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
 *   npx ts-node tools/scripts/eas-e2e.ts --project betterangels \
 *     [--configuration preview|production]
 *
 * The configuration (default `preview`) picks the profile env written into the
 * tracked `.env` and the default build profiles per platform.
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

import { ensureBuilds } from './eas-builds';
import { easConfiguration } from './eas-configurations';
import {
  EAS_ACCOUNT,
  argv,
  getEnv,
  getOptionalEnv,
  resolveProjectDir,
  run,
  runJson,
  setupEnv,
} from './eas-utils';

const project = argv.project as string | undefined;
if (!project) {
  console.error(
    'Usage: eas-e2e.ts --project <name> [--configuration preview|production]',
  );
  process.exit(1);
}

/**
 * The Nx configuration selects more than an EAS profile: it also picks the env
 * written into the tracked `.env`, which is what the build and the update
 * resolve. The targets have no default command, so this cannot be omitted.
 */
const configuration =
  (argv.configuration as string | undefined) ??
  getOptionalEnv('EAS_CONFIGURATION') ??
  'preview';

const eas = easConfiguration(configuration);
// Narrowed once: TypeScript does not carry the `--project` guard into helpers.
const projectName: string = project;

// Maestro drives the simulator binary for a preview, and the device build for
// production — the simulator profile is the only build a simulator installs.
const androidProfile = eas.device.android;
const iosProfile = eas.simulatorProfile ?? eas.device.ios;
const branch = getEnv('BRANCH_NAME');
const projectDir = resolveProjectDir(project);

console.log(`EAS configuration: ${configuration}`);
console.log(`Profiles: android=${androidProfile}, ios=${iosProfile}`);

// 1. Setup env once (it is identical across profiles). `copy-lockfile` comes
// next, before anything is resolved or looked up, because it rewrites the
// manifests the fingerprint hashes: `preview.yml` runs it before resolving the
// runtime, and a runtime computed from a different workspace state is a runtime
// no build ever produces.
setupEnv(projectDir, androidProfile);
run('yarn', ['nx', 'run', `${project}:copy-lockfile`]);

// 2. Find or queue both builds. This is the preview/main pipelines' rule, so a
// fingerprint is never built twice across them; the runtimes it returns are the
// ones the workflow's get-build filter must match.
const builds = ensureBuilds({
  project: projectName,
  targets: [
    { platform: 'android', profile: androidProfile },
    { platform: 'ios', profile: iosProfile },
  ],
});
const androidBuild = builds.find((build) => build.platform === 'android');
const iosBuild = builds.find((build) => build.platform === 'ios');
if (!androidBuild?.build?.id || !iosBuild?.build?.id) {
  throw new Error('Failed to resolve build IDs for both platforms');
}
const androidBuildId = androidBuild.build.id;
const iosBuildId = iosBuild.build.id;
const androidRuntime = androidBuild.runtime;
const iosRuntime = iosBuild.runtime;
console.log(`\nBuilds: android ${androidBuildId}, ios ${iosBuildId}`);

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
const updates = runJson<Array<{ group: string; platform: string }>>('yarn', [
  'nx',
  'run',
  `${project}:eas-update:${configuration}`,
]);
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
  'npx',
  [
    'eas',
    'workflow:run',
    '.eas/workflows/e2e-test.yml',
    '-F',
    `android_build_id=${androidBuildId}`,
    '-F',
    `ios_build_id=${iosBuildId}`,
    '-F',
    `update_group_id=${groupId}`,
    '-F',
    `MAESTRO_BA_USER_EMAIL=${process.env.MAESTRO_BA_USER_EMAIL}`,
    '-F',
    `MAESTRO_BA_USER_PASSWORD=${process.env.MAESTRO_BA_USER_PASSWORD}`,
    '-F',
    `app_id=${eas.appId}`,
    '-F',
    `scheme=${eas.scheme}`,
    '-F',
    `android_runtime_version=${androidRuntime}`,
    '-F',
    `ios_runtime_version=${iosRuntime}`,
    // The workflow derives the build profiles from the configuration, so an
    // override here would desync the get-build filter from the build.
    '-F',
    `configuration=${configuration}`,
    '--non-interactive',
  ],
  { cwd: projectDir },
);

console.log('\nE2E tests triggered on EAS');
