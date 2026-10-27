/**
 * Mobile preview summary for a PR (and Slack, on main).
 *
 * Replaces the comment payload the old `eas-deploy.ts` posted: per-platform
 * build permalinks, EAS Update permalinks + QR codes, runtime versions, and the
 * iOS simulator build link. It only *reads* EAS state — builds and updates are
 * created by `eas-build` / `eas-update` targets — so it stays reusable from a
 * laptop (`nx run betterangels:preview-comment`) and from both workflows.
 *
 * Env:
 *   BRANCH_NAME            EAS Update branch (required)
 *   PR_NUMBER, GITHUB_TOKEN, GITHUB_REPOSITORY   PR comment (optional)
 *   SLACK_WEBHOOK_URL, GITHUB_EVENT_NAME         Slack (main only)
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2), {
  string: ['project', 'account', 'slug', 'projectId'],
});

const usage = 'node tools/scripts/eas-preview-comment.mjs --project <name> --account <eas-account> --slug <slug> --projectId <id>';
if (!argv.project || !argv.account || !argv.slug || !argv.projectId) {
  console.error(usage);
  process.exit(1);
}

const projectDir = path.resolve('apps', argv.project);
const branch = process.env.BRANCH_NAME;
if (!branch) {
  console.error('BRANCH_NAME is required (the EAS Update branch).');
  process.exit(1);
}

const PLATFORMS = ['android', 'ios'];
// `EAS_PROFILE` lets the main pipeline report the production builds instead;
// the simulator link only exists for preview.
const profile = process.env.EAS_PROFILE || 'preview';
const BUILDS = [
  { platform: 'android', profile },
  { platform: 'ios', profile },
  ...(profile === 'preview'
    ? [{ platform: 'ios', profile: 'development-simulator' }]
    : []),
];

/** `eas` prints notices before the JSON; take the outermost array. */
function runJson(args) {
  const raw = execFileSync('eas', args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error(`No JSON in eas ${args[0]} output`);
  return JSON.parse(raw.slice(start, end + 1));
}

const buildUrl = (id) =>
  `https://expo.dev/accounts/${argv.account}/projects/${argv.slug}/builds/${id}`;
const updateUrl = (id) =>
  `https://expo.dev/projects/${argv.projectId}/updates/${id}`;
const qrUrl = (groupId) =>
  `https://qr.expo.dev/eas-update?appScheme=${argv.slug}&projectId=${argv.projectId}&groupId=${groupId}`;

function latestBuild(platform, profile) {
  try {
    return runJson([
      'build:list',
      '--platform',
      platform,
      '--build-profile',
      profile,
      '--limit',
      '1',
      '--json',
      '--non-interactive',
    ])[0];
  } catch (error) {
    console.error(`Could not list ${platform}/${profile} builds: ${error.message}`);
    return undefined;
  }
}

function latestUpdate(platform) {
  try {
    return runJson([
      'update:list',
      '--branch',
      branch,
      '--platform',
      platform,
      '--limit',
      '1',
      '--json',
      '--non-interactive',
    ])[0];
  } catch (error) {
    console.error(`Could not list ${platform} updates: ${error.message}`);
    return undefined;
  }
}

const builds = Object.fromEntries(
  BUILDS.map(({ platform, profile }) => [
    `${platform}/${profile}`,
    latestBuild(platform, profile),
  ]),
);
const updates = Object.fromEntries(PLATFORMS.map((p) => [p, latestUpdate(p)]));

const android = builds[`android/${profile}`];
const ios = builds[`ios/${profile}`];
if (!android && !ios && !updates.android && !updates.ios) {
  // EAS was unreachable (missing CLI, expired token, …). Posting a comment full
  // of N/A would be worse than no comment — this runs in a non-required job.
  console.error('No EAS build or update data; skipping the preview summary.');
  process.exit(0);
}
const simulator = builds['ios/development-simulator'];

// `eas build:list` reports the runtime under `runtime.version` (and the
// fingerprint hash alongside); there is no top-level `runtimeVersion`.
const runtimeOf = (build) =>
  build?.runtime?.version ?? build?.fingerprint?.hash ?? 'N/A';

const cell = (build) =>
  build
    ? `[Build Permalink](${buildUrl(build.id)})<br /><details><summary>Details</summary>Status: \`${build.status}\`<br />Distribution: \`${build.distribution ?? ''}\`<br />Build profile: \`${build.buildProfile ?? ''}\`<br />Runtime version: \`${runtimeOf(build)}\`<br />App version: \`${build.appVersion ?? ''}\`<br />Git commit: \`${build.gitCommitHash ?? ''}\`</details>`
    : 'N/A';

const updateCell = (update) =>
  update
    ? `[Update Permalink](${updateUrl(update.id)})<br /><details><summary>Details</summary>Branch: \`${update.branch ?? ''}\`<br />Runtime version: \`${update.runtimeVersion ?? ''}\`<br />Git commit: \`${update.gitCommitHash ?? ''}\`</details>`
    : 'N/A';

const qrCell = (update) =>
  update
    ? `<a href="${qrUrl(update.group)}"><img src="${qrUrl(update.group)}" width="250px" height="250px" /></a>`
    : 'N/A';

const body = `<!-- continuous-deploy-fingerprint-projectId:${argv.projectId} -->
🚀 Expo continuous deployment is ready for **${argv.project}**!

- Project → **${argv.project}**
- Environment → **${profile}**
- Platforms → **android**, **ios**
- Scheme → **${argv.slug}**

&nbsp; | 🤖 Android | 🍎 iOS
--- | --- | ---
Runtime Version | \`${runtimeOf(android)}\` | \`${runtimeOf(ios)}\`
Build Details | ${cell(android)} | ${cell(ios)}
Update Details | ${updateCell(updates.android)} | ${updateCell(updates.ios)}
Update QR | ${qrCell(updates.android)} | ${qrCell(updates.ios)}

**iOS Simulator Build:** ${
  simulator ? `[Simulator Build Link](${buildUrl(simulator.id)})` : 'N/A'
}`;

async function upsertPrComment() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  if (!token || !repo || !prNumber) {
    console.log('Skipping PR comment (no PR context).');
    return;
  }

  const [owner, repoName] = repo.split('/');
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  const listResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments?per_page=100`,
    { headers },
  );
  if (!listResponse.ok) {
    console.error(`Could not list comments: ${listResponse.status}`);
    return;
  }
  const marker = `continuous-deploy-fingerprint-projectId:${argv.projectId}`;
  const existing = (await listResponse.json()).find((comment) =>
    comment.body?.includes(marker),
  );

  const url = existing
    ? `https://api.github.com/repos/${owner}/${repoName}/issues/comments/${existing.id}`
    : `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`;
  const response = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers,
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    console.error(`Could not post comment: ${response.status}`);
    return;
  }
  console.log(existing ? 'Updated the preview comment.' : 'Created the preview comment.');
}

async function notifySlack() {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  // PR previews get the comment above; only deployments get a Slack ping.
  if (!webhook || process.env.GITHUB_EVENT_NAME === 'pull_request') return;

  const link = (label, url) => (url ? `<${url}|${label}>` : label);
  const section = (platform, build, update) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${platform}*\n${link('Update', update ? updateUrl(update.id) : undefined)} · ${link(
        'Build',
        build ? buildUrl(build.id) : undefined,
      )}`,
    },
  });

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `📱 ${argv.project} deployed to *${branch}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📱 *${argv.project}* deployed to \`${branch}\` (runtime \`${runtimeOf(android) === 'N/A' ? runtimeOf(ios) : runtimeOf(android)}\`)`,
          },
        },
        section('Android', android, updates.android),
        section('iOS', ios, updates.ios),
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${link('iOS simulator build', simulator ? buildUrl(simulator.id) : undefined)}`,
          },
        },
      ],
    }),
  });
  if (!response.ok) {
    console.error(`Slack webhook failed: ${response.status}`);
  } else {
    console.log('Posted the deploy summary to Slack.');
  }
}

// Local runs have no `eas` on PATH and no PR/Slack context; make that explicit
// rather than failing half way.
if (!existsSync(path.join(projectDir, 'eas.json'))) {
  console.error(`${projectDir}/eas.json is missing.`);
  process.exit(1);
}

// Best effort: the preview itself already succeeded, and this step should not
// turn the job red because GitHub or Slack hiccuped.
try {
  await upsertPrComment();
  await notifySlack();
} catch (error) {
  console.error(`Preview summary skipped: ${error.message}`);
}
