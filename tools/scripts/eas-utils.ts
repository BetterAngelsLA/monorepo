/**
 * Shared utilities for the EAS scripts (eas-e2e.ts).
 *
 * Provides common helpers for:
 *   - CLI arg parsing (minimist)
 *   - Environment variable access
 *   - Command execution with JSON parsing
 *   - .env / fingerprint setup
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import minimist from 'minimist';
import * as path from 'path';
import stripAnsi from 'strip-ansi';

export const argv = minimist(process.argv.slice(2));

export const EAS_ACCOUNT = process.env.EAS_ACCOUNT || 'better-angels';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpdateResult {
  platform: string;
  id: string;
  group: string;
  branch: string;
  gitCommitHash: string;
  runtimeVersion: string;
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

export function getEnv(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

// ---------------------------------------------------------------------------
// Command execution
// ---------------------------------------------------------------------------

/**
 * Run a command and return stdout (trimmed).
 */
export function run(
  cmd: string,
  opts?: { cwd?: string; silent?: boolean },
): string {
  const cwd = opts?.cwd ?? process.cwd();
  if (!opts?.silent) console.log(`> ${cmd}`);
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error: any) {
    if (error.stderr) console.error(error.stderr);
    if (error.stdout) console.error(error.stdout);
    throw error;
  }
}

/**
 * Run a command and parse its stdout as JSON.
 * Handles nx/eas CLI output that may contain ANSI codes and non-JSON text
 * by finding the first valid JSON array or object in the output.
 */
export function runJson<T>(cmd: string, opts?: { cwd?: string }): T {
  const raw = run(cmd, { silent: true, ...opts });
  const cleaned = stripAnsi(raw);

  // Find the first valid JSON object or array in the output.
  // NX may append trailing text (e.g. "NX   Successfully ran target ..."),
  // so also try trimming at the last matching bracket.
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '[' || ch === '{') {
      // Fast path: parse from here to end of string
      try {
        return JSON.parse(cleaned.substring(i)) as T;
      } catch {
        // Trailing content — find the last matching close bracket
        const close = ch === '[' ? ']' : '}';
        const lastClose = cleaned.lastIndexOf(close);
        if (lastClose > i) {
          try {
            return JSON.parse(cleaned.substring(i, lastClose + 1)) as T;
          } catch {
            // keep scanning
          }
        }
      }
    }
  }

  throw new Error(
    `Could not parse JSON from output:\n${cleaned.slice(0, 500)}`,
  );
}

// ---------------------------------------------------------------------------
// Project helpers
// ---------------------------------------------------------------------------

/**
 * Resolve and validate a project directory under apps/.
 */
export function resolveProjectDir(project: string): string {
  const projectDir = path.resolve(process.cwd(), 'apps', project);
  if (!fs.existsSync(projectDir)) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }
  return projectDir;
}

// ---------------------------------------------------------------------------
// EAS / Expo helpers
// ---------------------------------------------------------------------------

/**
 * Write the profile env the runtime version is computed from.
 *
 * `write-eas-env.mjs` is the only writer; a second one would let the fingerprint
 * and the upload disagree.
 */
export function setupEnv(projectDir: string, profile: string): void {
  console.log(`\n=== Setting up env for profile: ${profile} ===`);
  const project = path.basename(projectDir);
  run(
    `node tools/scripts/write-eas-env.mjs --project ${project} --profile ${profile}`,
  );
}

/**
 * Resolve the runtime version (fingerprint hash) for one platform.
 *
 * Fingerprints are per platform, so a lookup keyed on the other platform's hash
 * always misses. No `expo prebuild`: `--workflow generic` fingerprints the project
 * as uploaded, and a local prebuild would hash native directories the build never
 * has.
 */
export function resolveRuntime(projectDir: string, platform: string): string {
  console.log(`Resolving ${platform} runtime version (fingerprint)...`);
  const resolved = runJson<{ runtimeVersion: string }>(
    `npx expo-updates runtimeversion:resolve --platform ${platform} --workflow generic`,
    { cwd: projectDir },
  );
  const hash = resolved.runtimeVersion;
  if (!hash) {
    throw new Error(
      `expo-updates did not return a runtime version for ${platform}`,
    );
  }
  console.log(`${platform} runtime version (fingerprint): ${hash}`);
  return hash;
}

/** Setup env and resolve the runtime, for callers that need only one platform. */
export function setupEnvAndFingerprint(
  projectDir: string,
  profile: string,
  platform = 'android',
): string {
  setupEnv(projectDir, profile);
  return resolveRuntime(projectDir, platform);
}
