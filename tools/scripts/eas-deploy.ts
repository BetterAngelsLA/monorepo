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
 *
 * EXPO_PUBLIC_* secrets (passed individually from GitHub Secrets):
 *   EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY
 *   EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY
 *   EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_IOS
 *   EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_ANDROID
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  EAS_ACCOUNT,
  UpdateResult,
  argv,
  getEnv,
  getOptionalEnv,
  resolveProjectDir,
  run,
  runJson,
  setupEnvAndFingerprint,
} from './eas-utils';

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
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { project: string; profile: string } {
  const { project, profile } = argv;
  if (!project || !profile) {
    console.error('Usage: eas-deploy.ts --project <name> --profile <profile>');
    process.exit(1);
  }
  return { project, profile };
}

// ---------------------------------------------------------------------------
// Step 1: Check/Trigger EAS Build
// ---------------------------------------------------------------------------

function checkOrTriggerBuild(
  project: string,
  profile: string,
  runtimeVersion: string,
  platforms: string[]
): {
  slug: string;
  projectId: string;
  builds: Record<string, PlatformBuildResult>;
} {
  console.log(
    `\n=== Checking/triggering ${profile} builds for platforms: ${platforms.join(
      ', '
    )} ===`
  );

  const builds: Record<string, PlatformBuildResult> = {};
  let slug = '';
  let projectId = '';

  for (const platform of platforms) {
    console.log(`--- ${platform} ---`);

    let buildData: BuildInfo[];
    try {
      buildData = runJson<BuildInfo[]>(
        `yarn nx run ${project}:build-list --platform ${platform} --buildProfile ${profile} --runtimeVersion ${runtimeVersion} --limit 1 --json --interactive false`
      );
    } catch {
      buildData = [];
    }

    if (buildData.length > 0) {
      console.log(
        `Found existing ${platform} build for runtime ${runtimeVersion}.`
      );
    } else {
      console.log(
        `No existing ${platform} build for runtime ${runtimeVersion}. Starting new build.`
      );
      buildData = runJson<BuildInfo[]>(
        `yarn nx run ${project}:eas-build --profile ${profile} --platform ${platform} --freeze-credentials --interactive false --wait false --json`
      );
    }

    const info = buildData[0];
    slug = info.project.slug;
    projectId = info.project.id;
    builds[platform] = toBuildResult(info, slug);
  }

  return { slug, projectId, builds };
}

function toBuildResult(info: BuildInfo, slug: string): PlatformBuildResult {
  return {
    buildId: info.id,
    buildLink: `https://expo.dev/accounts/${EAS_ACCOUNT}/projects/${slug}/builds/${info.id}`,
    distribution: info.distribution,
    buildProfile: info.buildProfile,
    runtimeVersion: info.runtimeVersion,
    appVersion: info.appVersion,
    gitCommit: info.gitCommitHash,
  };
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

  const updateData = runJson<UpdateResult[]>(
    `yarn nx run ${project}:eas-update --branch "${branch}" --auto --json --interactive false`
  );
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
// Step 2: PR Comment
// ---------------------------------------------------------------------------

async function postPrComment(results: DeployResults): Promise<void> {
  const token = getOptionalEnv('GITHUB_TOKEN');
  const repo = getOptionalEnv('GITHUB_REPOSITORY');
  const prNumber = getOptionalEnv('PR_NUMBER');

  if (!token || !repo || !prNumber) {
    console.log(
      'Skipping PR comment (missing GITHUB_TOKEN, GITHUB_REPOSITORY, or PR_NUMBER)'
    );
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
Runtime Version | \`${android?.runtimeVersion ?? 'N/A'}\` | \`${
    ios?.runtimeVersion ?? 'N/A'
  }\`
Build Details | [Build Permalink](${
    android?.buildLink ?? ''
  })<br /><details><summary>Details</summary>Distribution: \`${
    android?.distribution ?? ''
  }\`<br />Build profile: \`${
    android?.buildProfile ?? ''
  }\`<br />Runtime version: \`${
    android?.runtimeVersion ?? ''
  }\`<br />App version: \`${android?.appVersion ?? ''}\`<br />Git commit: \`${
    android?.gitCommit ?? ''
  }\`</details> | [Build Permalink](${
    ios?.buildLink ?? ''
  })<br /><details><summary>Details</summary>Distribution: \`${
    ios?.distribution ?? ''
  }\`<br />Build profile: \`${
    ios?.buildProfile ?? ''
  }\`<br />Runtime version: \`${
    ios?.runtimeVersion ?? ''
  }\`<br />App version: \`${ios?.appVersion ?? ''}\`<br />Git commit: \`${
    ios?.gitCommit ?? ''
  }\`</details>
Update Details | [Update Permalink](${
    androidUpdate?.permalink ?? ''
  })<br /><details><summary>Details</summary>Branch: \`${
    androidUpdate?.branch ?? ''
  }\`<br />Runtime version: \`${
    androidUpdate?.runtimeVersion ?? ''
  }\`<br />Git commit: \`${
    androidUpdate?.commit ?? ''
  }\`</details> | [Update Permalink](${
    iosUpdate?.permalink ?? ''
  })<br /><details><summary>Details</summary>Branch: \`${
    iosUpdate?.branch ?? ''
  }\`<br />Runtime version: \`${
    iosUpdate?.runtimeVersion ?? ''
  }\`<br />Git commit: \`${iosUpdate?.commit ?? ''}\`</details>
Update QR   | <a href="${androidUpdate?.qrUrl ?? ''}"><img src="${
    androidUpdate?.qrUrl ?? ''
  }" width="250px" height="250px" /></a> | <a href="${
    iosUpdate?.qrUrl ?? ''
  }"><img src="${iosUpdate?.qrUrl ?? ''}" width="250px" height="250px" /></a>

**iOS Simulator Build:** [Simulator Build Link](${simIos?.buildLink ?? ''})`;

  // Find existing comment
  const listUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments?per_page=100`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'eas-deploy-script',
  };

  const listRes = await fetch(listUrl, { method: 'GET', headers });
  if (listRes.status !== 200) {
    console.error(
      `Failed to list comments: ${listRes.status} ${await listRes.text()}`
    );
    return;
  }

  const comments = (await listRes.json()) as Array<{
    id: number;
    body: string;
  }>;
  const existing = comments.find((c) => c.body.includes(marker));

  if (existing) {
    const updateUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/comments/${existing.id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body }),
    });
    if (updateRes.status !== 200) {
      console.error(
        `Failed to update comment: ${
          updateRes.status
        } ${await updateRes.text()}`
      );
    } else {
      console.log('Updated existing PR comment');
    }
  } else {
    const createUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });
    if (createRes.status !== 201) {
      console.error(
        `Failed to create comment: ${
          createRes.status
        } ${await createRes.text()}`
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
          text: `*📱 iOS*\n\n<${iosUpdate?.qrUrl ?? ''}|Update>\n<${
            iosBuild?.buildLink ?? ''
          }|Build>\n<${simBuild?.buildLink ?? ''}|Simulator Build>`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🤖 Android*\n\n<${androidUpdate?.qrUrl ?? ''}|Update>\n<${
            androidBuild?.buildLink ?? ''
          }|Build>`,
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status !== 200) {
    console.error(
      `Slack notification failed: ${res.status} ${await res.text()}`
    );
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

  const projectDir = resolveProjectDir(project);

  // 1. Setup secrets and get runtime version
  const runtimeVersion = setupEnvAndFingerprint(projectDir, profile);

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

  // 5. PR comment (pull_request only, preview only)
  if (eventName === 'pull_request' && isPreview) {
    await postPrComment(results);
  }

  // 6. Slack (push to main, both preview and production)
  if (eventName === 'push') {
    await postSlackNotification(results);
  }

  console.log('\n✅ EAS deploy complete');
}

main().catch((err) => {
  console.error('EAS deploy failed:', err.message || err);
  process.exit(1);
});
