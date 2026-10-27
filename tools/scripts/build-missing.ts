/**
 * Queue an EAS build for each target whose fingerprint has none.
 *
 *   npx ts-node --project tools/tsconfig.tools.json tools/scripts/build-missing.ts \
 *     --project betterangels --configuration preview [--platforms android,ios]
 *
 * Run after `write-eas-env` and `copy-lockfile`: the runtime resolved here has to
 * be the one the upload produces. `--platforms` defaults to `EAS_BUILD_PLATFORMS`
 * (the preview workflow computes it) and then to `android`. Which profile each
 * platform uses, and that a preview also ships an iOS simulator binary, comes
 * from `EAS_CONFIGURATIONS`.
 *
 * Reuse is the point: a fingerprint builds once, so a target with any existing
 * build — queued, finished or failed — is skipped. The one exception is the
 * `force-eas-build` label / FORCE_EAS_BUILD, for a build that failed for a reason
 * that has since been fixed.
 */
import { execFileSync } from 'child_process';
import * as path from 'path';

import { easConfiguration } from './eas-configurations';
import { argv, getEnv, resolveProjectDir, resolveRuntime } from './eas-utils';

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
    'android',
)
  .split(',')
  .map((platform) => platform.trim())
  .filter(Boolean);

const projectDir = resolveProjectDir(project);
getEnv('EXPO_TOKEN');

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

const runtimes = new Map<string, string>();
const runtimeFor = (platform: string) => {
  if (!runtimes.has(platform)) {
    runtimes.set(platform, resolveRuntime(projectDir, platform));
  }
  return runtimes.get(platform)!;
};

const existingBuild = (platform: string, profile: string, runtime: string) => {
  const output = execFileSync(
    'node',
    [
      path.resolve(process.cwd(), 'tools/scripts/find-build.mjs'),
      '--project',
      project,
      '--platform',
      platform,
      '--profile',
      profile,
      '--runtime',
      runtime,
      '--json',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  try {
    return (JSON.parse(output) as { id: string | null }).id;
  } catch {
    // `find-build` prints JSON on stdout; a stray log line must not look like
    // "no build" or crash with a raw SyntaxError.
    throw new Error(`find-build did not return JSON: ${output.slice(0, 200)}`);
  }
};

for (const { platform, profile } of targets) {
  const existing = existingBuild(platform, profile, runtimeFor(platform));
  if (existing) {
    console.log(`Reusing the existing ${platform} build: ${existing}`);
    continue;
  }
  console.log(`Queueing ${platform} build (profile: ${profile})...`);
  execFileSync(
    'eas',
    [
      'build',
      '--platform',
      platform,
      '--profile',
      profile,
      '--non-interactive',
      '--no-wait',
      '--freeze-credentials',
      '--json',
    ],
    { cwd: projectDir, stdio: 'inherit', env: process.env },
  );
}
