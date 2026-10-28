/**
 * Queue an EAS build for each target whose fingerprint has none, and record what
 * was resolved for the preview comment.
 *
 *   npx ts-node --project tools/tsconfig.tools.json tools/scripts/build-missing.ts \
 *     --project betterangels --configuration preview [--platforms android,ios]
 *
 * Run after `copy-lockfile`, after `eas env:pull` (`.env.local`): the
 * runtime resolved here has to be the one the upload produces. `--platforms` defaults to `EAS_BUILD_PLATFORMS`
 * and then to both device platforms: a fingerprint builds once, so only what is
 * missing is queued. Which profile each platform uses, and that a preview also
 * ships an iOS simulator binary, comes from `EAS_CONFIGURATIONS`; the
 * find-or-queue rule itself is `eas-builds.ts`, shared with the E2E trigger.
 *
 * Every target is written to `<project>/.eas-builds.json` with the build object
 * `eas` returned, whether it was reused or queued here. That is what
 * `eas-preview-comment.mjs` renders, and it is a working permalink the moment
 * `nx run betterangels:eas-build --wait=false --json` answers — before `build:list` lists it.
 */
import { writeFileSync } from 'fs';
import * as path from 'path';

import { ensureBuilds } from './eas-builds';
import { easConfiguration } from './eas-configurations';
import { argv, resolveProjectDir } from './eas-utils';

const project = argv.project as string | undefined;
const configuration = (argv.configuration as string | undefined) ?? 'preview';

if (!project) {
  console.error(
    'Usage: build-missing.ts --project <name> [--configuration <config>] [--profile <profile>] [--platforms android,ios]',
  );
  process.exit(1);
}

const eas = easConfiguration(configuration);
const deviceProfile = argv.profile as string | undefined;
const platforms = String(
  (argv.platforms as string | undefined) ??
    process.env.EAS_BUILD_PLATFORMS ??
    'android,ios',
)
  .split(',')
  .map((platform) => platform.trim())
  .filter(Boolean);

const projectDir = resolveProjectDir(project);

// Device builds for the requested platforms, plus the simulator binary a preview
// always ships — a separate profile, and the only build a simulator installs.
const targets = [
  ...platforms.map((platform) => ({
    platform,
    profile:
      deviceProfile ??
      eas.device[platform as keyof typeof eas.device] ??
      configuration,
  })),
  ...(eas.simulatorProfile
    ? [{ platform: 'ios', profile: eas.simulatorProfile }]
    : []),
];

const resultsPath = path.join(projectDir, '.eas-builds.json');
// Empty first: a crash mid-run must not leave a previous run's ids looking like
// this run's builds to the comment that runs next.
writeFileSync(resultsPath, '[]\n');

const builds = ensureBuilds({ project, targets });
writeFileSync(resultsPath, `${JSON.stringify(builds, null, 2)}\n`);
console.log(`Recorded ${builds.length} build(s) in ${resultsPath}`);
