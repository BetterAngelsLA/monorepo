/**
 * Shared utilities for EAS scripts (eas-deploy.ts, etc.)
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
  opts?: { cwd?: string; silent?: boolean }
): string {
  const cwd = opts?.cwd ?? process.cwd();
  if (!opts?.silent) console.log(`> ${cmd}`);
  return execSync(cmd, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
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
    `Could not parse JSON from output:\n${cleaned.slice(0, 500)}`
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
 * Write .env with build-profile env vars + EXPO_PUBLIC_* secrets,
 * then compute the Expo fingerprint hash. Returns the hash.
 */
export function setupEnvAndFingerprint(
  projectDir: string,
  profile: string
): string {
  console.log(`\n=== Setting up env for profile: ${profile} ===`);

  const envPath = path.join(projectDir, '.env');
  const envLines: string[] = [];

  // Load non-secret env vars from eas.json build profile
  const easJsonPath = path.join(projectDir, 'eas.json');
  if (fs.existsSync(easJsonPath)) {
    const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
    const profileEnv = easConfig?.build?.[profile]?.env;
    if (profileEnv && typeof profileEnv === 'object') {
      for (const [key, value] of Object.entries(profileEnv)) {
        envLines.push(`${key}=${value}`);
      }
    }
  }

  // Collect EXPO_PUBLIC_* secrets from env (passed individually from CI)
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('EXPO_PUBLIC') && value) {
      envLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, envLines.join('\n') + '\n');

  // Compute fingerprint — this hash becomes the runtimeVersion.
  console.log('Computing fingerprint...');
  const fingerprintJson = run(
    `node -e "const fp = require('@expo/fingerprint'); fp.createFingerprintAsync('.').then(r => console.log(JSON.stringify(r)));"`,
    { cwd: projectDir }
  );
  const hash = JSON.parse(fingerprintJson).hash as string;
  console.log(`Runtime version (fingerprint): ${hash}`);

  // Write to .env so dotenv.config() in app.config.js picks it up
  fs.appendFileSync(envPath, `RUNTIME_VERSION=${hash}\n`);
  process.env.RUNTIME_VERSION = hash;

  return hash;
}
