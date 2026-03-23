/**
 * EAS Deploy Script
 *
 * Orchestrates the full EAS deployment pipeline for a project:
 *   1. Setup secrets (EXPO_PUBLIC env vars for EAS Build + compute fingerprint)
 *   2. Check/trigger EAS builds (preview or production)
 *   3. Optionally trigger simulator build (preview only)
 *   4. Perform EAS update
 *   5. Post PR comment (pull_request events)
 *   6. Post Slack notification (push to main)
 *   7. Trigger E2E tests (merge_group events)
 *
 * Usage:
 *   npx ts-node tools/scripts/eas-deploy.ts --project betterangels --profile preview
 *
 * Required env vars:
 *   EXPO_TOKEN          - EAS authentication token
 *   BRANCH_NAME         - Git branch name
 *
 * Optional env vars (for PR comments / Slack / E2E):
 *   GITHUB_TOKEN        - GitHub API token
 *   GITHUB_REPOSITORY   - owner/repo
 *   GITHUB_EVENT_NAME   - push | pull_request | merge_group
 *   GITHUB_SHA          - Current commit SHA
 *   PR_NUMBER           - Pull request number
 *   SLACK_WEBHOOK_URL   - Slack incoming webhook URL
 *   EAS_ACCOUNT         - EAS account name (default: better-angels)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuildInfo {
  id: string;
  project: { slug: string; id: string };
  distribution: string;
  buildProfile: string;
  runtimeVersion: string;
  appVersion: string;
  gitCommitHash: string;
}

interface PlatformBuildResult {
  buildId: string;
  buildLink: string;
  distribution: string;
  buildProfile: string;
  runtimeVersion: string;
  appVersion: string;
  gitCommit: string;
}

interface UpdateResult {
  platform: string;
  id: string;
  group: string;
  branch: string;
  gitCommitHash: string;
  runtimeVersion: string;
}

interface DeployResults {
  project: string;
  slug: string;
  projectId: string;
  builds: Record<string, PlatformBuildResult>;
  simulatorBuilds: Record<string, PlatformBuildResult>;
  updates: Record<
    string,
    {
      updateId: string;
      permalink: string;
      qrUrl: string;
      branch: string;
      commit: string;
      runtimeVersion: string;
    }
  >;
  groupId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(): { project: string; profile: string } {
  const args = process.argv.slice(2);
  let project = '';
  let profile = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && args[i + 1]) project = args[++i];
    else if (args[i] === '--profile' && args[i + 1]) profile = args[++i];
    else if (args[i].startsWith('--project='))
      project = args[i].split('=')[1];
    else if (args[i].startsWith('--profile='))
      profile = args[i].split('=')[1];
  }
  if (!project || !profile) {
    console.error('Usage: eas-deploy.ts --project <name> --profile <profile>');
    process.exit(1);
  }
  return { project, profile };
}

function getEnv(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

function getOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

/**
 * Run a command and return stdout. Strips non-JSON noise from nx/eas CLI output.
 */
function run(cmd: string, opts?: { cwd?: string; silent?: boolean }): string {
  const cwd = opts?.cwd ?? process.cwd();
  if (!opts?.silent) console.log(`> ${cmd}`);
  return execSync(cmd, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  }).trim();
}

/**
 * Extract the first complete JSON array or object from a string that may
 * contain non-JSON text before/after (common with nx/eas CLI output).
 */
function extractFirstJson(raw: string): unknown {
  // Find the first [ or {
  let startIdx = -1;
  let startChar = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '[' || raw[i] === '{') {
      startIdx = i;
      startChar = raw[i];
      break;
    }
  }
  if (startIdx === -1) {
    throw new Error('No JSON found in output');
  }
  const endChar = startChar === '[' ? ']' : '}';
  let depth = 0;
  for (let i = startIdx; i < raw.length; i++) {
    if (raw[i] === startChar || raw[i] === (startChar === '[' ? '{' : '['))
      depth++;
    if (raw[i] === endChar || raw[i] === (endChar === ']' ? '}' : ']'))
      depth--;
    // More precise: track both [] and {} independently
    // Simpler approach: try parsing at each potential end
    if (raw[i] === endChar) {
      try {
        const candidate = raw.substring(startIdx, i + 1);
        const parsed = JSON.parse(candidate);
        return parsed;
      } catch {
        // Not complete yet, keep going
      }
    }
  }
  throw new Error(`Could not extract valid JSON from output:\n${raw.slice(0, 500)}`);
}

/**
 * Simple HTTPS/HTTP request helper (no external deps needed).
 */
function httpRequest(
  url: string,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    const req = mod.request(
      parsedUrl,
      {
        method: options.method,
        headers: options.headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, body: data })
        );
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Step 1: Setup Secrets
// ---------------------------------------------------------------------------

function setupSecrets(projectDir: string, profile: string): string {
  console.log(`\n=== Setting up secrets for profile: ${profile} ===`);

  const envPath = path.join(projectDir, '.env');

  // Write EXPO_PUBLIC_* secrets from the CI environment (e.g. Google Maps keys)
  // that are not already defined in eas.json's env block.
  // eas.json env vars are injected automatically by EAS Build servers.
  const envLines: string[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('EXPO_PUBLIC') && value !== undefined) {
      envLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, envLines.join('\n') + '\n');

  // Compute fingerprint (used to check for existing builds via build-list).
  // The runtimeVersion in app.config.js uses { policy: 'fingerprint' } so
  // EAS Build and EAS Update both compute it natively — we only need the
  // hash here for querying existing builds.
  console.log('Computing fingerprint...');
  const fingerprintJson = run(
    `node -e "const fp = require('@expo/fingerprint'); fp.createFingerprintAsync('.').then(r => console.log(JSON.stringify(r)));"`,
    { cwd: projectDir }
  );
  const hash = JSON.parse(fingerprintJson).hash as string;
  console.log(`Runtime version (fingerprint): ${hash}`);

  return hash;
}

// ---------------------------------------------------------------------------
// Step 2: Check/Trigger EAS Build
// ---------------------------------------------------------------------------

function checkOrTriggerBuild(
  project: string,
  profile: string,
  runtimeVersion: string,
  platforms: string[]
): { slug: string; projectId: string; builds: Record<string, PlatformBuildResult> } {
  console.log(
    `\n=== Checking/triggering ${profile} builds for platforms: ${platforms.join(', ')} ===`
  );

  const builds: Record<string, PlatformBuildResult> = {};
  let slug = '';
  let projectId = '';

  for (const platform of platforms) {
    console.log(`--- ${platform} ---`);

    // Check for existing builds
    let rawOutput: string;
    try {
      rawOutput = run(
        `yarn nx run ${project}:build-list --platform ${platform} --buildProfile ${profile} --runtimeVersion ${runtimeVersion} --limit 1 --json --interactive false`,
        { silent: true }
      );
    } catch {
      rawOutput = '[]';
    }

    let buildData: BuildInfo[];
    try {
      buildData = extractFirstJson(rawOutput) as BuildInfo[];
    } catch {
      buildData = [];
    }

    if (!Array.isArray(buildData) || buildData.length === 0) {
      console.log(
        `No existing ${platform} build for runtime ${runtimeVersion}. Starting new build.`
      );
      try {
        rawOutput = run(
          `yarn nx run ${project}:build --profile ${profile} --platform ${platform} --freeze-credentials --interactive false --wait false --json`,
          { silent: true }
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Build command failed for ${platform}: ${msg}`);
        throw e;
      }

      try {
        buildData = extractFirstJson(rawOutput) as BuildInfo[];
      } catch (e) {
        console.error(`Could not parse build output for ${platform}`);
        console.error(`Raw output: ${rawOutput.slice(0, 500)}`);
        throw e;
      }
    } else {
      console.log(
        `Found existing ${platform} build for runtime ${runtimeVersion}.`
      );
    }

    const info = buildData[0];
    slug = info.project.slug;
    projectId = info.project.id;

    builds[platform] = {
      buildId: info.id,
      buildLink: `https://expo.dev/accounts/better-angels/projects/${slug}/builds/${info.id}`,
      distribution: info.distribution,
      buildProfile: info.buildProfile,
      runtimeVersion: info.runtimeVersion,
      appVersion: info.appVersion,
      gitCommit: info.gitCommitHash,
    };
  }

  return { slug, projectId, builds };
}

// ---------------------------------------------------------------------------
// Step 3: EAS Update
// ---------------------------------------------------------------------------

function performEasUpdate(
  project: string,
  branch: string,
  slug: string,
  projectId: string
): {
  updates: DeployResults['updates'];
  groupId: string;
} {
  console.log(`\n=== Performing EAS Update on branch: ${branch} ===`);

  let rawOutput: string;
  try {
    rawOutput = run(
      `yarn nx run ${project}:eas-update --branch "${branch}" --auto --json --interactive false`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`EAS update failed: ${msg}`);
    throw e;
  }

  const updateData = extractFirstJson(rawOutput) as UpdateResult[];
  const updates: DeployResults['updates'] = {};
  let groupId = '';

  for (const entry of updateData) {
    const permalink = `https://expo.dev/projects/${projectId}/updates/${entry.id}`;
    const qrUrl = `https://qr.expo.dev/eas-update?appScheme=${slug}&projectId=${projectId}&groupId=${entry.group}`;
    updates[entry.platform] = {
      updateId: entry.id,
      permalink,
      qrUrl,
      branch: entry.branch,
      commit: entry.gitCommitHash,
      runtimeVersion: entry.runtimeVersion,
    };
    groupId = entry.group;
  }

  return { updates, groupId };
}

// ---------------------------------------------------------------------------
// Step 4: Write E2E metadata + trigger
// ---------------------------------------------------------------------------

function writeE2eMetadata(
  projectDir: string,
  slug: string,
  projectId: string,
  groupId: string,
  runtimeVersion: string
): void {
  const envPath = path.join(projectDir, '.env');
  const repository = getOptionalEnv('GITHUB_REPOSITORY') ?? '';
  const sha = getOptionalEnv('GITHUB_SHA') ?? '';
  const account = getOptionalEnv('EAS_ACCOUNT') ?? 'better-angels';

  const lines = [
    `GITHUB_REPOSITORY=${repository}`,
    `GITHUB_STATUS_SHA=${sha}`,
    `GITHUB_STATUS_CONTEXT=Betterangels E2E Tests`,
    `EAS_ACCOUNT=${account}`,
    `EAS_PROJECT_SLUG=${slug}`,
    `PROJECT_ID=${projectId}`,
    `GROUP_ID=${groupId}`,
    `RUNTIME_VERSION=${runtimeVersion}`,
  ];

  fs.appendFileSync(envPath, lines.join('\n') + '\n');
}

function triggerE2e(projectDir: string): void {
  console.log('\n=== Triggering E2E workflow ===');
  run('npx eas-cli workflow:run .eas/workflows/e2e-test.yml --non-interactive', {
    cwd: projectDir,
  });
}

// ---------------------------------------------------------------------------
// Step 5: PR Comment
// ---------------------------------------------------------------------------

async function postPrComment(results: DeployResults): Promise<void> {
  const token = getOptionalEnv('GITHUB_TOKEN');
  const repo = getOptionalEnv('GITHUB_REPOSITORY');
  const prNumber = getOptionalEnv('PR_NUMBER');

  if (!token || !repo || !prNumber) {
    console.log('Skipping PR comment (missing GITHUB_TOKEN, GITHUB_REPOSITORY, or PR_NUMBER)');
    return;
  }

  console.log(`\n=== Posting PR comment for PR #${prNumber} ===`);

  const [owner, repoName] = repo.split('/');
  const marker = `<!-- continuous-deploy-fingerprint-projectId:${results.projectId} -->`;

  const android = results.builds['android'];
  const ios = results.builds['ios'];
  const simIos = results.simulatorBuilds['ios'];
  const androidUpdate = results.updates['android'];
  const iosUpdate = results.updates['ios'];

  const body = `${marker}
🚀 Expo continuous deployment is ready for **${results.project}**!

- Project → **${results.project}**
- Environment → **Preview**
- Platforms → **android**, **ios**
- Scheme → **${results.slug}**

&nbsp; | 🤖 Android | 🍎 iOS
--- | --- | ---
Runtime Version | \`${android?.runtimeVersion ?? 'N/A'}\` | \`${ios?.runtimeVersion ?? 'N/A'}\`
Build Details | [Build Permalink](${android?.buildLink ?? ''})<br /><details><summary>Details</summary>Distribution: \`${android?.distribution ?? ''}\`<br />Build profile: \`${android?.buildProfile ?? ''}\`<br />Runtime version: \`${android?.runtimeVersion ?? ''}\`<br />App version: \`${android?.appVersion ?? ''}\`<br />Git commit: \`${android?.gitCommit ?? ''}\`</details> | [Build Permalink](${ios?.buildLink ?? ''})<br /><details><summary>Details</summary>Distribution: \`${ios?.distribution ?? ''}\`<br />Build profile: \`${ios?.buildProfile ?? ''}\`<br />Runtime version: \`${ios?.runtimeVersion ?? ''}\`<br />App version: \`${ios?.appVersion ?? ''}\`<br />Git commit: \`${ios?.gitCommit ?? ''}\`</details>
Update Details | [Update Permalink](${androidUpdate?.permalink ?? ''})<br /><details><summary>Details</summary>Branch: \`${androidUpdate?.branch ?? ''}\`<br />Runtime version: \`${androidUpdate?.runtimeVersion ?? ''}\`<br />Git commit: \`${androidUpdate?.commit ?? ''}\`</details> | [Update Permalink](${iosUpdate?.permalink ?? ''})<br /><details><summary>Details</summary>Branch: \`${iosUpdate?.branch ?? ''}\`<br />Runtime version: \`${iosUpdate?.runtimeVersion ?? ''}\`<br />Git commit: \`${iosUpdate?.commit ?? ''}\`</details>
Update QR   | <a href="${androidUpdate?.qrUrl ?? ''}"><img src="${androidUpdate?.qrUrl ?? ''}" width="250px" height="250px" /></a> | <a href="${iosUpdate?.qrUrl ?? ''}"><img src="${iosUpdate?.qrUrl ?? ''}" width="250px" height="250px" /></a>

**iOS Simulator Build:** [Simulator Build Link](${simIos?.buildLink ?? ''})`;

  // Find existing comment
  const listUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments?per_page=100`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'eas-deploy-script',
  };

  const listRes = await httpRequest(listUrl, { method: 'GET', headers });
  if (listRes.status !== 200) {
    console.error(`Failed to list comments: ${listRes.status} ${listRes.body}`);
    return;
  }

  const comments = JSON.parse(listRes.body) as Array<{
    id: number;
    body: string;
  }>;
  const existing = comments.find((c) => c.body.includes(marker));

  if (existing) {
    const updateUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/comments/${existing.id}`;
    const updateRes = await httpRequest(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body }),
    });
    if (updateRes.status !== 200) {
      console.error(
        `Failed to update comment: ${updateRes.status} ${updateRes.body}`
      );
    } else {
      console.log('Updated existing PR comment');
    }
  } else {
    const createUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`;
    const createRes = await httpRequest(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });
    if (createRes.status !== 201) {
      console.error(
        `Failed to create comment: ${createRes.status} ${createRes.body}`
      );
    } else {
      console.log('Created new PR comment');
    }
  }
}

// ---------------------------------------------------------------------------
// Step 6: Slack Notification
// ---------------------------------------------------------------------------

async function postSlackNotification(results: DeployResults): Promise<void> {
  const webhookUrl = getOptionalEnv('SLACK_WEBHOOK_URL');
  if (!webhookUrl) {
    console.log('Skipping Slack notification (no SLACK_WEBHOOK_URL)');
    return;
  }

  console.log('\n=== Posting Slack notification ===');

  const commitId = run('git rev-parse HEAD', { silent: true });
  const commitMessage = run('git log -1 --pretty=format:"%s" HEAD', {
    silent: true,
  });

  const iosUpdate = results.updates['ios'];
  const androidUpdate = results.updates['android'];
  const iosBuild = results.builds['ios'];
  const androidBuild = results.builds['android'];
  const simBuild = results.simulatorBuilds['ios'];

  const payload = {
    channel: '#tech-outreach-main',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New code has landed in main for project ${results.project}!* \n*Commit:* \`${commitId}\`\n*Message:* ${commitMessage}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📱 iOS*\n\n<${iosUpdate?.qrUrl ?? ''}|Update>\n<${iosBuild?.buildLink ?? ''}|Build>\n<${simBuild?.buildLink ?? ''}|Simulator Build>`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🤖 Android*\n\n<${androidUpdate?.qrUrl ?? ''}|Update>\n<${androidBuild?.buildLink ?? ''}|Build>`,
        },
      },
    ],
  };

  const res = await httpRequest(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status !== 200) {
    console.error(`Slack notification failed: ${res.status} ${res.body}`);
  } else {
    console.log('Slack notification sent');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { project, profile } = parseArgs();
  const branchName = getEnv('BRANCH_NAME');
  const eventName = getOptionalEnv('GITHUB_EVENT_NAME') ?? '';

  const projectDir = path.resolve(process.cwd(), 'apps', project);
  if (!fs.existsSync(projectDir)) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  // 1. Setup secrets and get runtime version
  const runtimeVersion = setupSecrets(projectDir, profile);

  // 2. Check/trigger builds
  const isPreview = profile === 'preview';
  const buildPlatforms = ['android', 'ios'];
  const { slug, projectId, builds } = checkOrTriggerBuild(
    project,
    profile,
    runtimeVersion,
    buildPlatforms
  );

  // 3. Simulator build (preview only)
  let simulatorBuilds: Record<string, PlatformBuildResult> = {};
  if (isPreview) {
    const simResult = checkOrTriggerBuild(
      project,
      'development-simulator',
      runtimeVersion,
      ['ios']
    );
    simulatorBuilds = simResult.builds;
  }

  // 4. EAS Update
  const { updates, groupId } = performEasUpdate(
    project,
    branchName,
    slug,
    projectId
  );

  const results: DeployResults = {
    project,
    slug,
    projectId,
    builds,
    simulatorBuilds,
    updates,
    groupId,
  };

  // Write results to JSON for downstream consumers
  const resultsPath = path.join(projectDir, '.eas-deploy-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${resultsPath}`);

  // 5. E2E (merge_group only)
  if (eventName === 'merge_group' && isPreview) {
    writeE2eMetadata(projectDir, slug, projectId, groupId, runtimeVersion);
    triggerE2e(projectDir);
  }

  // 6. PR comment (pull_request only, preview only)
  if (eventName === 'pull_request' && isPreview) {
    await postPrComment(results);
  }

  // 7. Slack (push to main, both preview and production)
  if (eventName === 'push') {
    await postSlackNotification(results);
  }

  // Restore original .env (remove CI-injected secrets)
  const envPath = path.join(projectDir, '.env');
  fs.writeFileSync(
    envPath,
    'EXPO_PUBLIC_API_URL=https://api.dev.betterangels.la\nEXPO_PUBLIC_DEMO_API_URL=http://localhost:8000\n'
  );
  console.log('Restored original .env');

  console.log('\n✅ EAS deploy complete');
}

main().catch((err) => {
  console.error('EAS deploy failed:', err.message || err);
  process.exit(1);
});
