/**
 * Shared utilities for EAS scripts (eas-deploy.ts, etc.)
 *
 * Provides common helpers for:
 *   - CLI arg parsing (minimist)
 *   - Environment variable access
 *   - Command execution with JSON parsing
 *   - .env / fingerprint setup
 */

import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import minimist from 'minimist';
import * as path from 'path';
import stripAnsi from 'strip-ansi';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

function parseJsonOutput<T>(raw: string): T {
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

/**
 * Run a command and parse its stdout as JSON.
 * Handles nx/eas CLI output that may contain ANSI codes and non-JSON text.
 */
export function runJson<T>(cmd: string, opts?: { cwd?: string }): T {
  return parseJsonOutput<T>(run(cmd, { silent: true, ...opts }));
}

/**
 * Async variant of {@link runJson}, for callers that can run independent
 * commands concurrently (e.g. the per-platform EAS build lookups).
 */
export async function runJsonAsync<T>(
  cmd: string,
  opts?: { cwd?: string },
): Promise<T> {
  const cwd = opts?.cwd ?? process.cwd();
  try {
    const { stdout } = await execAsync(cmd, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return parseJsonOutput<T>(stdout.toString());
  } catch (error: any) {
    if (error.stderr) console.error(error.stderr);
    if (error.stdout) console.error(error.stdout);
    throw error;
  }
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
 * Collect EXPO_PUBLIC_* / MAESTRO_* from the environment, then layer the
 * eas.json build-profile env on top (the profile wins).
 */
export function collectEnv(
  projectDir: string,
  profile: string,
): Map<string, string> {
  const envMap = new Map<string, string>();

  for (const [key, value] of Object.entries(process.env)) {
    if (
      (key.startsWith('EXPO_PUBLIC_') || key.startsWith('MAESTRO_')) &&
      value
    ) {
      envMap.set(key, value);
    }
  }

  const easJsonPath = path.join(projectDir, 'eas.json');
  if (fs.existsSync(easJsonPath)) {
    const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
    const profileEnv = easConfig?.build?.[profile]?.env;
    if (profileEnv && typeof profileEnv === 'object') {
      for (const [key, value] of Object.entries(profileEnv)) {
        envMap.set(key, String(value));
      }
    }
  }

  return envMap;
}

export function writeEnvFile(
  projectDir: string,
  envMap: Map<string, string>,
): void {
  const envLines: string[] = [];
  envMap.forEach((value, key) => {
    envLines.push(`${key}=${value}`);
  });
  fs.writeFileSync(path.join(projectDir, '.env'), envLines.join('\n') + '\n');
}

export function computeFingerprint(projectDir: string): string {
  console.log('Computing fingerprint...');
  const fingerprintJson = run(
    `node -e "const fp = require('@expo/fingerprint'); fp.createFingerprintAsync('.').then(r => console.log(JSON.stringify(r)));"`,
    { cwd: projectDir },
  );
  const hash = JSON.parse(fingerprintJson).hash as string;
  console.log(`Runtime version (fingerprint): ${hash}`);
  return hash;
}

/**
 * Compute the fingerprint with a temporary .env, then restore the original
 * file. The required checks run sync-deps too, and .env is tracked, so
 * leaving the profile env behind would fail the generated-types git diff.
 */
export function computeFingerprintForTarget(
  projectDir: string,
  profile: string,
): string {
  console.log(`\n=== Computing fingerprint for profile: ${profile} ===`);

  const envPath = path.join(projectDir, '.env');
  const original = fs.existsSync(envPath) ? fs.readFileSync(envPath) : null;

  try {
    writeEnvFile(projectDir, collectEnv(projectDir, profile));
    return computeFingerprint(projectDir);
  } finally {
    if (original === null) {
      if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
    } else {
      fs.writeFileSync(envPath, original);
    }
  }
}

/**
 * Write the profile .env for an actual EAS build/update. Only the deploy
 * tasks call this; checks use computeFingerprintForTarget and leave .env alone.
 */
export function writeEasEnv(
  projectDir: string,
  profile: string,
  runtimeVersion: string,
): void {
  const envMap = collectEnv(projectDir, profile);
  envMap.set('RUNTIME_VERSION', runtimeVersion);
  writeEnvFile(projectDir, envMap);
  envMap.forEach((value, key) => {
    process.env[key] = value;
  });
}

/**
 * Compute and leave the .env in place. Kept for callers that need the
 * profile env afterwards; the deploy path uses writeEasEnv with a runtime
 * computed earlier by eas-fingerprint.
 */
export function setupEnvAndFingerprint(
  projectDir: string,
  profile: string,
): string {
  console.log(`\n=== Setting up env for profile: ${profile} ===`);

  const envMap = collectEnv(projectDir, profile);
  writeEnvFile(projectDir, envMap);

  const hash = computeFingerprint(projectDir);

  fs.appendFileSync(path.join(projectDir, '.env'), `RUNTIME_VERSION=${hash}\n`);
  envMap.set('RUNTIME_VERSION', hash);
  envMap.forEach((value, key) => {
    process.env[key] = value;
  });

  return hash;
}
