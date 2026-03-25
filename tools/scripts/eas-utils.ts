/**
 * Shared utilities for EAS scripts (eas-deploy.ts, eas-e2e-trigger.ts, etc.)
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

  // Find the first valid JSON object or array in the output
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '[' || cleaned[i] === '{') {
      try {
        return JSON.parse(cleaned.substring(i)) as T;
      } catch {
        // Not valid JSON from this position, keep scanning
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

/**
 * Read slug and projectId from .eas-deploy-results.json or app.config.js.
 */
export function readProjectConfig(projectDir: string): {
  slug: string;
  projectId: string;
} {
  // Read from .eas-deploy-results.json if a prior deploy wrote it
  const resultsPath = path.join(projectDir, '.eas-deploy-results.json');
  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    if (results.slug && results.projectId) {
      return { slug: results.slug, projectId: results.projectId };
    }
  }

  // Fallback: parse app.config.js
  const configPath = path.join(projectDir, 'app.config.js');
  if (!fs.existsSync(configPath)) {
    throw new Error(`No app.config.js found at ${configPath}`);
  }
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const slugMatch = configContent.match(/slug:\s*'([^']+)'/);
  const projectIdMatch = configContent.match(/projectId:\s*'([^']+)'/);
  if (!slugMatch || !projectIdMatch) {
    throw new Error(`Could not parse slug/projectId from ${configPath}`);
  }
  return { slug: slugMatch[1], projectId: projectIdMatch[1] };
}

/**
 * Trigger the EAS E2E workflow for a project directory.
 * Returns the workflow URL if captured from the output.
 */
export function triggerEasWorkflow(
  projectDir: string,
  account: string,
  slug: string
): string {
  console.log('Triggering EAS workflow...');
  const rawOutput = run(
    'npx eas-cli workflow:run .eas/workflows/e2e-test.yml --non-interactive',
    { cwd: projectDir }
  );

  const output = stripAnsi(rawOutput);

  const urlMatch = output.match(/https:\/\/expo\.dev\/[^\s]+/);
  if (urlMatch) return urlMatch[0];

  const uuidMatch = output.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  );
  if (uuidMatch) {
    return `https://expo.dev/accounts/${account}/projects/${slug}/workflows/${uuidMatch[0]}`;
  }

  return '';
}

/**
 * Write .env metadata that the EAS e2e-test.yml workflow reads.
 */
export function writeE2eMetadata(
  projectDir: string,
  opts: {
    runtimeVersion: string;
    projectId: string;
    groupId: string;
    slug: string;
    sha: string;
    statusContext: string;
    account: string;
  }
): void {
  const envPath = path.join(projectDir, '.env');
  const repository = getOptionalEnv('GITHUB_REPOSITORY') ?? '';

  const lines = [
    `RUNTIME_VERSION=${opts.runtimeVersion}`,
    `PROJECT_ID=${opts.projectId}`,
    `GROUP_ID=${opts.groupId}`,
    `GITHUB_REPOSITORY=${repository}`,
    `GITHUB_STATUS_SHA=${opts.sha}`,
    `GITHUB_STATUS_CONTEXT=${opts.statusContext}`,
    `EAS_ACCOUNT=${opts.account}`,
    `EAS_PROJECT_SLUG=${opts.slug}`,
  ];
  fs.writeFileSync(envPath, lines.join('\n') + '\n');
}

/**
 * Clean up .env file in a project directory.
 */
export function cleanupEnv(projectDir: string): void {
  const envPath = path.join(projectDir, '.env');
  if (fs.existsSync(envPath)) fs.unlinkSync(envPath);
}
