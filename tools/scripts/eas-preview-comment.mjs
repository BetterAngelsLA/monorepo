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

import { bestBuild } from './build-rank.mjs';

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

// Both platforms always get a column: the app supports both, and the update is
// published for both even when a run only built one of them. Which builds exist
// is what `EAS_BUILD_PLATFORMS` decides, per column.
const PLATFORMS = ['android', 'ios'];
const BUILT = (process.env.EAS_BUILD_PLATFORMS ?? 'android,ios')
  .split(',')
  .map((platform) => platform.trim())
  .filter(Boolean);
// `EAS_PROFILE` lets the main pipeline report the production builds instead;
// the simulator link only exists for preview.
const profile = process.env.EAS_PROFILE || 'preview';
const BUILDS = [
  ...BUILT.map((platform) => ({ platform, profile })),
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
// `eas update:list` has no per-update id: an update group is the addressable
// unit, and it is what the EAS dashboard links to.
const updateUrl = (group) =>
  `https://expo.dev/projects/${argv.projectId}/updates/${group}`;
const qrUrl = (groupId) =>
  `https://qr.expo.dev/eas-update?appScheme=${argv.slug}&projectId=${argv.projectId}&groupId=${groupId}`;

function latestBuild(platform, profile, runtime) {
  try {
    const args = [
      'build:list',
      '--platform',
      platform,
      '--build-profile',
      profile,
      '--limit',
      '5',
      '--json',
      '--non-interactive',
    ];
    // Only the build that ships this update's runtime: without the filter the
    // newest FINISHED build can belong to a previous commit, and the comment
    // would pair this update with a binary it can never reach.
    if (runtime) args.push('--runtime-version', runtime);
    const builds = runJson(args);
    if (builds.length === 0) return undefined;
    // A real artifact wins over a newer dead one: the reuse rule is "a
    // fingerprint builds once", so a canceled or failed attempt can sit in front
    // of the build that actually exists, and reporting that one would link a QR
    // code to nothing. `bestBuild` also keeps recency within the same rank.
    return bestBuild(builds);
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

const updates = Object.fromEntries(PLATFORMS.map((p) => [p, latestUpdate(p)]));
const builds = Object.fromEntries(
  BUILDS.map(({ platform, profile }) => [
    `${platform}/${profile}`,
    latestBuild(platform, profile, updates[platform]?.runtimeVersion),
  ]),
);

const forPlatform = (platform) => builds[`${platform}/${profile}`];
const hasData =
  PLATFORMS.some((platform) => forPlatform(platform)) ||
  PLATFORMS.some((platform) => updates[platform]);
if (!hasData) {
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
    ? `[Build Permalink](${buildUrl(build.id)})<br /><details><summary>Details</summary>Distribution: \`${build.distribution ?? ''}\`<br />Build profile: \`${build.buildProfile ?? ''}\`<br />Runtime version: \`${runtimeOf(build)}\`<br />App version: \`${build.appVersion ?? ''}\`<br />Git commit: \`${build.gitCommitHash ?? ''}\`</details>`
    : 'N/A';

const updateCell = (update) =>
  update
    ? `[Update Permalink](${updateUrl(update.group)})<br /><details><summary>Details</summary>Branch: \`${update.branch ?? ''}\`<br />Runtime version: \`${update.runtimeVersion ?? ''}\`<br />Git commit: \`${update.gitCommitHash ?? ''}\`</details>`
    : 'N/A';

const qrCell = (update) =>
  update
    ? `<a href="${qrUrl(update.group)}"><img src="${qrUrl(update.group)}" width="250px" height="250px" /></a>`
    : 'N/A';

const PLATFORM_LABELS = { android: '🤖 Android', ios: '🍎 iOS' };
const table = [
  ['&nbsp;', ...PLATFORMS.map((platform) => PLATFORM_LABELS[platform] ?? platform)],
  ['---', ...PLATFORMS.map(() => '---')],
  [
    'Runtime Version',
    ...PLATFORMS.map(
      (p) => `\`${forPlatform(p) ? runtimeOf(forPlatform(p)) : (updates[p]?.runtimeVersion ?? 'N/A')}\``,
    ),
  ],
  ['Build Details', ...PLATFORMS.map((p) => cell(forPlatform(p)))],
  ['Update Details', ...PLATFORMS.map((p) => updateCell(updates[p]))],
  ['Update QR', ...PLATFORMS.map((p) => qrCell(updates[p]))],
]
  .map((row) => row.join(' | '))
  .join('\n');

const body = `<!-- continuous-deploy-fingerprint-projectId:${argv.projectId} -->
🚀 Expo continuous deployment is ready for **${argv.project}**!

- Project → **${argv.project}**
- Environment → **${profile.charAt(0).toUpperCase()}${profile.slice(1)}**
- Platforms → ${PLATFORMS.map((platform) => `**${platform}**`).join(', ')}
- Scheme → **${argv.slug}**

${table}
${simulator ? `\n**iOS Simulator Build:** [Simulator Build Link](${buildUrl(simulator.id)})` : ''}`;

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
  const section = (title, platform) => {
    const build = forPlatform(platform);
    const sim = platform === 'ios' ? simulator : undefined;
    // The platform headings are not bold in the message this pipeline has always
    // posted; only the header is.
    const lines = [
      title,
      '',
      link('Update', updates[platform] ? updateUrl(updates[platform].group) : undefined),
      link('Build', build ? buildUrl(build.id) : undefined),
      ...(sim ? [link('Simulator Build', buildUrl(sim.id))] : []),
    ];
    const runtime = build ? runtimeOf(build) : updates[platform]?.runtimeVersion;
    if (runtime) lines.push(`_Runtime:_ \`${runtime}\``);
    return { type: 'section', text: { type: 'mrkdwn', text: lines.join('\n') } };
  };

  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const message = execFileSync('git', ['log', '-1', '--pretty=%s'], {
    encoding: 'utf8',
  }).trim();

  // Matches the notification this pipeline has always posted: a header, then one
  // block per platform with Update / Build / Simulator Build links.
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*New code has landed in main for project ${argv.project}!* \n*Commit:* \`${commit}\`\n*Message:* ${message}`,
      },
    },
    section(':iphone: iOS', 'ios'),
    { type: 'divider' },
    section(':robot_face: Android', 'android'),
  ];

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: '#tech-outreach-main', blocks }),
  });
  if (!response.ok) {
    console.error(`Slack notification failed: ${response.status} ${await response.text()}`);
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
