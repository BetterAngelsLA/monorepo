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
 * Write the profile env, prebuild, then resolve the runtime version the same
 * way an EAS build does. Returns the runtime version (fingerprint hash).
 *
 * The prebuild matters: `expo-updates … --workflow generic` fingerprints the
 * generated native projects too, and EAS prebuilds before it fingerprints. A
 * bare `@expo/fingerprint` call would produce a different hash, and every
 * build/update lookup keyed on it would miss.
 */
export function setupEnvAndFingerprint(
  projectDir: string,
  profile: string,
): string {
  console.log(`\n=== Setting up env for profile: ${profile} ===`);

  const project = path.basename(projectDir);
  run(`node tools/scripts/write-eas-env.mjs --project ${project} --profile ${profile}`);
  // Mirror the build: EAS prebuilds before fingerprinting. Called directly
  // rather than through `nx run` so this never nests Nx inside a Nx task.
  run('npx expo prebuild --no-install', { cwd: projectDir });

  console.log('Resolving runtime version (fingerprint)...');
  const resolved = runJson<{ runtimeVersion: string }>(
    'npx expo-updates runtimeversion:resolve --platform android --workflow generic',
    { cwd: projectDir },
  );
  const hash = resolved.runtimeVersion;
  if (!hash) {
    throw new Error('expo-updates did not return a runtime version');
  }
  console.log(`Runtime version (fingerprint): ${hash}`);
  return hash;
}
