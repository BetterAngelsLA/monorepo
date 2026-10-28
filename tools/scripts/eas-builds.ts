/**
 * Find or queue the EAS build for each target.
 *
 * One implementation for every pipeline that needs a binary: the preview/main
 * step (`build-missing.ts`) and the Maestro E2E trigger (`eas-e2e.ts`).
 *
 * Reuse is the pipeline rule: a fingerprint builds once, in any status, so a
 * target with any existing build — queued, finished or failed — is skipped. The
 * one exception is the `force-eas-build` label / FORCE_EAS_BUILD, which
 * `find-build.mjs` honours for a build that failed for a reason since fixed.
 *
 * Run after `copy-lockfile`, after `eas env:pull` (`.env.local`): the
 * runtime resolved here has to be the one the upload produces.
 */
import { execFileSync } from 'child_process';
import * as path from 'path';

import {
  getEnv,
  resolveProjectDir,
  resolveRuntime,
  runJson,
} from './eas-utils';

export interface BuildTarget {
  platform: string;
  profile: string;
}

/** A build as `eas` returns it: from `build:list` on reuse, the build target when queued. */
export interface EasBuild {
  id: string;
  [field: string]: unknown;
}

export interface ResolvedBuild extends BuildTarget {
  runtime: string;
  build: EasBuild | null;
  /** True when the build already existed for this runtime, false when queued here. */
  reused: boolean;
}

export function ensureBuilds({
  project,
  targets,
}: {
  project: string;
  targets: BuildTarget[];
}): ResolvedBuild[] {
  getEnv('EXPO_TOKEN');
  const projectDir = resolveProjectDir(project);

  // Fingerprints are per platform, so a lookup keyed on the other platform's
  // hash always misses. Resolved once per platform, however many targets use it.
  const runtimes = new Map<string, string>();
  const runtimeFor = (platform: string) => {
    if (!runtimes.has(platform)) {
      runtimes.set(platform, resolveRuntime(projectDir, platform));
    }
    return runtimes.get(platform)!;
  };

  const existing = (
    platform: string,
    profile: string,
    runtime: string,
  ): EasBuild | undefined => {
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
      // `find-build --json` prints the build, or `{ id: null }` when none exists.
      const build = JSON.parse(output) as Partial<EasBuild> | null;
      return build?.id ? (build as EasBuild) : undefined;
    } catch {
      // `find-build` prints JSON on stdout; a stray log line must not look like
      // "no build" or crash with a raw SyntaxError.
      throw new Error(
        `find-build did not return JSON: ${output.slice(0, 200)}`,
      );
    }
  };

  return targets.map(({ platform, profile }) => {
    const runtime = runtimeFor(platform);
    const reusedBuild = existing(platform, profile, runtime);
    if (reusedBuild) {
      // Name the profile: a preview has both `ios/preview` and
      // `ios/development-simulator`, and "ios" alone cannot tell them apart.
      console.log(
        `Reusing the existing ${platform}/${profile} build: ${reusedBuild.id}`,
      );
      return { platform, profile, runtime, build: reusedBuild, reused: true };
    }

    console.log(`Queueing ${platform} build (profile: ${profile})...`);
    // `--wait=false` answers with the build object immediately, before `build:list`
    // lists it: its id is already a working permalink.
    let payload: EasBuild | EasBuild[] | null = null;
    try {
      payload = runJson<EasBuild | EasBuild[]>(
        'nx',
        [
          'run',
          'betterangels:eas-build',
          '--platform',
          platform,
          '--profile',
          profile,
          '--wait=false',
          '--freezeCredentials',
          '--json',
        ],
        { cwd: process.cwd() },
      );
    } catch (error) {
      console.warn(
        `Could not read the ${platform} build from eas build output (${error instanceof Error ? error.message : String(error)}); falling back to build:list.`,
      );
      return { platform, profile, runtime, build: null, reused: false };
    }
    const build = Array.isArray(payload) ? payload[0] : payload;
    if (!build?.id) {
      console.warn(
        `Could not read the ${platform} build from eas build output; the comment will fall back to build:list.`,
      );
      return { platform, profile, runtime, build: null, reused: false };
    }
    console.log(`Queued ${platform} build: ${build.id}`);
    return { platform, profile, runtime, build, reused: false };
  });
}
