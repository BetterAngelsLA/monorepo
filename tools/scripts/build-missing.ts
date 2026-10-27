/**
 * Queue an EAS build for each platform whose fingerprint has none.
 *
 *   npx ts-node --project tools/tsconfig.tools.json tools/scripts/build-missing.ts \
 *     --project betterangels --configuration preview [--platforms android,ios]
 *
 * Run after `write-eas-env` and `copy-lockfile`: the runtime resolved here has to
 * be the one the upload produces. `--platforms` defaults to `EAS_BUILD_PLATFORMS`
 * (the preview workflow computes it) and then to `android`.
 *
 * Reuse is the point: a fingerprint builds once, so a platform with any existing
 * build — queued, finished or failed — is skipped. The one exception is the
 * `force-eas-build` label / FORCE_EAS_BUILD, for a build that failed for a reason
 * that has since been fixed.
 */
import { execFileSync } from 'child_process';
import * as path from 'path';

import {
  argv,
  getEnv,
  resolveProjectDir,
  resolveRuntime,
} from './eas-utils';

const project = argv.project as string | undefined;
const configuration = (argv.configuration as string | undefined) ?? 'preview';

if (!project) {
  console.error(
    'Usage: build-missing.ts --project <name> [--configuration <config>] [--profile <profile>] [--platforms android,ios]',
  );
  process.exit(1);
}

const profile = (argv.profile as string | undefined) ?? configuration;
const platforms = String(
  (argv.platforms as string | undefined) ?? process.env.EAS_BUILD_PLATFORMS ?? 'android',
)
  .split(',')
  .map((platform) => platform.trim())
  .filter(Boolean);

const projectDir = resolveProjectDir(project);
getEnv('EXPO_TOKEN');

for (const platform of platforms) {
  const runtime = resolveRuntime(projectDir, platform);

  const found = execFileSync(
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

  const existing = (JSON.parse(found) as { id: string | null }).id;
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
