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
 *   EAS_BUILD_PLATFORMS    what this run built; the comment reports both anyway
 *
 * Flags:
 *   --dry-run              print the comment instead of posting it (or DRY_RUN=1)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';

import { bestBuild } from './build-rank.mjs';
import { buildCell, fromRecord } from './preview-builds.mjs';

const argv = minimist(process.argv.slice(2), {
  string: ['project', 'account', 'slug', 'projectId'],
});

const usage =
  'node tools/scripts/eas-preview-comment.mjs --project <name> --account <eas-account> --slug <slug> --projectId <id>';
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

// Both platforms always get a column. `EAS_BUILD_PLATFORMS` says what this run
// *built* — a JS-only change deliberately skips the iOS device build — but a
// fingerprint builds once, so the binary for this runtime usually exists from an
// earlier run and is worth linking. What a run built must not decide what the
// comment reports; `buildCell` falls back when nothing exists.
const PLATFORMS = ['android', 'ios'];
// `EAS_PROFILE` lets the main pipeline report the production builds instead;
// the simulator link only exists for preview.
const profile = process.env.EAS_PROFILE || 'preview';
const BUILDS = [
  ...PLATFORMS.map((platform) => ({ platform, profile })),
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
  if (start < 0 || end < start)
    throw new Error(`No JSON in eas ${args[0]} output`);
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
    if (builds.length === 0) return { build: undefined };
    // A real artifact wins over a newer dead one: the reuse rule is "a
    // fingerprint builds once", so a canceled or failed attempt can sit in front
    // of the build that actually exists, and reporting that one would link a QR
    // code to nothing. `bestBuild` also keeps recency within the same rank.
    return { build: bestBuild(builds) };
  } catch (error) {
    console.error(
      `Could not list ${platform}/${profile} builds: ${error.message}`,
    );
    // Not the same as "no build": the cell says the lookup failed rather than
    // rendering an N/A that reads like a missing binary.
    return { error: error.message };
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

/**
 * Builds this run queued, as `build-missing.ts` recorded them.
 *
 * `eas build --json --no-wait` answers with the build the moment it is queued —
 * the id and permalink the old `eas-deploy.ts` linked. `build:list` can lag that
 * slightly, so this file is the fallback, not a second source of truth.
 */
function triggeredBuilds() {
  const file = path.join(projectDir, '.eas-builds.json');
  if (!existsSync(file)) return {};
  try {
    const entries = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(entries)) throw new Error('expected an array');
    return Object.fromEntries(
      entries.map((entry) => [`${entry.platform}/${entry.profile}`, entry]),
    );
  } catch (error) {
    console.error(`Could not read ${file}: ${error.message}`);
    return {};
  }
}

const updates = Object.fromEntries(PLATFORMS.map((p) => [p, latestUpdate(p)]));
const triggered = triggeredBuilds();
const lookups = Object.fromEntries(
  BUILDS.map(({ platform, profile }) => [
    `${platform}/${profile}`,
    latestBuild(platform, profile, updates[platform]?.runtimeVersion),
  ]),
);

const lookupFor = (platform) => lookups[`${platform}/${profile}`] ?? {};
const buildFor = (platform) => lookupFor(platform).build;
// A simulator build queued by this run can also be missing from `build:list` for
// a moment; its recorded id is the link a reviewer needs.
const simulatorRecord = triggered['ios/development-simulator'];
const simulator =
  lookups['ios/development-simulator']?.build ??
  (simulatorRecord?.buildId ? fromRecord(simulatorRecord) : undefined);

const hasData =
  PLATFORMS.some((platform) => buildFor(platform)) ||
  PLATFORMS.some((platform) => updates[platform]);
if (!hasData) {
  // EAS was unreachable (missing CLI, expired token, …). Posting a comment full
  // of lookups that failed would be worse than no comment — this runs in a
  // non-required job.
  console.error('No EAS build or update data; skipping the preview summary.');
  process.exit(0);
}

// `eas build:list` reports the runtime under `runtime.version` (and the
// fingerprint hash alongside); there is no top-level `runtimeVersion`.
const runtimeOf = (build) =>
  build?.runtime?.version ?? build?.fingerprint?.hash ?? 'N/A';

const updateCell = (update) =>
  update
    ? `[Update Permalink](${updateUrl(update.group)})<br /><details><summary>Details</summary>Branch: \`${update.branch ?? ''}\`<br />Runtime version: \`${update.runtimeVersion ?? ''}\`<br />Git commit: \`${update.gitCommitHash ?? ''}\`</details>`
    : 'N/A';

const qrCell = (update) =>
  update
    ? `<a href="${qrUrl(update.group)}"><img src="${qrUrl(update.group)}" width="250px" height="250px" /></a>`
    : 'N/A';

const PLATFORM_LABELS = { android: '🤖 Android', ios: '🍎 iOS' };
// Slack's headings use the shortcodes the old notification used; the table keeps
// the glyph labels it has always had. Both are keyed off PLATFORMS.
const SLACK_LABELS = { android: ':robot_face: Android', ios: ':iphone: iOS' };
const table = [
  [
    '&nbsp;',
    ...PLATFORMS.map((platform) => PLATFORM_LABELS[platform] ?? platform),
  ],
  ['---', ...PLATFORMS.map(() => '---')],
  [
    'Runtime Version',
    ...PLATFORMS.map(
      (p) =>
        `\`${
          buildFor(p)
            ? runtimeOf(buildFor(p))
            : (updates[p]?.runtimeVersion ?? 'unknown')
        }\``,
    ),
  ],
  [
    'Build Details',
    ...PLATFORMS.map((p) =>
      buildCell({
        account: argv.account,
        slug: argv.slug,
        runtime: updates[p]?.runtimeVersion,
        device: buildFor(p),
        triggered: triggered[`${p}/${profile}`],
        simulator: p === 'ios' ? simulator : undefined,
        error: lookupFor(p).error,
      }),
    ),
  ],
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
${
  simulator && buildFor('ios')
    ? `\n**iOS Simulator Build:** [Simulator Build Link](${buildUrl(simulator.id)})`
    : ''
}`;

// A laptop run is how this script is exercised without burning a CI cycle; it
// prints the same body the comment would carry.
if (argv['dry-run'] || process.env.DRY_RUN === '1') {
  console.log(body);
  process.exit(0);
}

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
  console.log(
    existing ? 'Updated the preview comment.' : 'Created the preview comment.',
  );
}

async function notifySlack() {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  // PR previews get the comment above; only deployments get a Slack ping.
  if (!webhook || process.env.GITHUB_EVENT_NAME === 'pull_request') return;

  const link = (label, url) =>
    url ? `<${url}|${label}>` : `${label}: not built for this run`;
  const section = (title, platform) => {
    const build = buildFor(platform);
    const sim = platform === 'ios' ? simulator : undefined;
    // The platform headings are not bold in the message this pipeline has always
    // posted; only the header is.
    const lines = [
      title,
      '',
      link(
        'Update',
        updates[platform] ? updateUrl(updates[platform].group) : undefined,
      ),
      link('Build', build ? buildUrl(build.id) : undefined),
      ...(sim ? [link('Simulator Build', buildUrl(sim.id))] : []),
    ];
    const runtime = build
      ? runtimeOf(build)
      : updates[platform]?.runtimeVersion;
    if (runtime) lines.push(`_Runtime:_ \`${runtime}\``);
    return {
      type: 'section',
      text: { type: 'mrkdwn', text: lines.join('\n') },
    };
  };

  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const message = execFileSync('git', ['log', '-1', '--pretty=%s'], {
    encoding: 'utf8',
  })
    .trim()
    // The subject is a PR title, i.e. attacker-controlled for anyone who can open
    // one: escape the three characters Slack treats as mrkdwn.
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

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
    ...PLATFORMS.flatMap((platform, index) => [
      ...(index > 0 ? [{ type: 'divider' }] : []),
      section(SLACK_LABELS[platform] ?? platform, platform),
    ]),
  ];

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: '#tech-outreach-main', blocks }),
  });
  if (!response.ok) {
    console.error(
      `Slack notification failed: ${response.status} ${await response.text()}`,
    );
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
