/**
 * The build rows of the two preview surfaces: the PR comment's "Build Details"
 * cell and the Slack message's Update / Build / Simulator Build lines.
 *
 * A fingerprint builds once, so the binary for this runtime usually already
 * exists from an earlier run; when it does not, `build-missing.ts` has just
 * queued it. Resolve, in order:
 *
 *   1. a build that exists for this runtime — this run's or an earlier one,
 *   2. the build this run resolved, recorded in `.eas-builds.json` by
 *      `build-missing.ts` (its link is valid the moment EAS answers, before
 *      `build:list` lists it),
 *   3. the iOS simulator binary, the artifact a reviewer on a laptop installs,
 *   4. an explicit "no build for <runtime>" / "lookup failed" — never a bare N/A
 *      and never a dropped row.
 */

/** How a cell explains where its binary came from. */
const NOTES = {
  queued: 'queued by this run',
  listed: 'existing build for this runtime',
  reused: 'reused — built for this runtime earlier',
  unlisted: 'queued by this run — not listed by EAS yet',
  simulator: 'simulator build — no device build for this runtime',
  simulatorAfterError: 'simulator build — device-build lookup failed',
};

const buildUrl = (account, slug, id) =>
  `https://expo.dev/accounts/${account}/projects/${slug}/builds/${id}`;

// `eas build:list` reports the runtime under `runtime.version` (and the
// fingerprint hash alongside); there is no top-level `runtimeVersion`.
const runtimeOf = (build) =>
  build?.runtime?.version ?? build?.fingerprint?.hash;

const field = (label, value) => `${label}: \`${value ?? '—'}\``;

/**
 * A record is only trusted for the runtime being reported: on a laptop the file
 * outlives the run that wrote it, and a stale id would link a binary this update
 * can never reach.
 */
const usable = (record, runtime) =>
  record?.build?.id &&
  (!runtime || !record.runtime || record.runtime === runtime)
    ? record
    : undefined;

/**
 * Which binary a row shows, and what it says about where it came from.
 *
 * `simulator` is the last resort for a *device* row; the simulator row passes its
 * own record and build instead, so it never borrows the device binary.
 */
export const pickBuild = ({
  device,
  triggered,
  simulator,
  simulatorTriggered,
  runtime,
  error,
}) => {
  const record = usable(triggered, runtime);
  const simulatorBuild =
    simulator ?? usable(simulatorTriggered, runtime)?.build;

  if (device) {
    const note =
      record?.build.id === device.id
        ? record.reused
          ? NOTES.reused
          : NOTES.queued
        : NOTES.listed;
    return { build: device, note };
  }
  if (record) {
    return {
      build: record.build,
      note: record.reused ? NOTES.reused : NOTES.unlisted,
    };
  }
  if (simulatorBuild) {
    return {
      build: simulatorBuild,
      note: error ? NOTES.simulatorAfterError : NOTES.simulator,
    };
  }
  return {};
};

/**
 * Why a row has no permalink. "Lookup failed" and "no build" are different facts,
 * and a failed `build:list` that reads as a missing binary is what sent people
 * looking for a build that already existed.
 */
export function missingText({ runtime, error }) {
  const which = runtime ? `\`${runtime}\`` : 'this runtime';
  return error
    ? `Lookup failed for ${which} — see the job log`
    : `No build for ${which}`;
}

/**
 * Render one platform's cell.
 *
 * `device` is the build found for `<platform>/<profile>`, `triggered` the record
 * `build-missing.ts` wrote for it this run, `simulator` the iOS simulator build
 * (with its own record), and `error` a `build:list` failure — which must not
 * read as "no build".
 */
export function buildCell({
  account,
  slug,
  runtime,
  device,
  triggered,
  simulator,
  simulatorTriggered,
  error,
}) {
  const { build, note } = pickBuild({
    device,
    triggered,
    simulator,
    simulatorTriggered,
    runtime,
    error,
  });
  if (!build) return missingText({ runtime, error });

  const details = [
    field('Distribution', build.distribution),
    field('Build profile', build.buildProfile),
    field('Runtime version', runtimeOf(build) ?? runtime),
    field('App version', build.appVersion),
    field('Git commit', build.gitCommitHash),
    field('Source', note),
  ];

  return `[Build Permalink](${buildUrl(
    account,
    slug,
    build.id,
  )})<br /><details><summary>Details</summary>${details.join(
    '<br />',
  )}</details>`;
}

const updateUrl = (projectId, group) =>
  `https://expo.dev/projects/${projectId}/updates/${group}`;

/** The platforms every preview surface reports, in message order. */
export const PLATFORMS = ['android', 'ios'];

// Slack's headings use the shortcodes the old notification used; the comment's
// table keeps the glyph labels it has always had.
const SLACK_LABELS = { android: ':robot_face: Android', ios: ':iphone: iOS' };

/**
 * Escape the three characters Slack treats as mrkdwn. The commit subject is a PR
 * title, i.e. attacker-controlled for anyone who can open one.
 */
const escapeMrkdwn = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * One platform's block in the Slack message: Update, Build and — on iOS — the
 * simulator binary.
 *
 * Slack has no table, so these rows *are* the message. Each one is rendered even
 * when it has no permalink: a row that disappears is indistinguishable from a
 * pipeline that forgot to build, which is what made "some posts have a simulator"
 * look random. `simulatorRow` is false on Android; `simulatorProfile` is false for
 * production, which ships no simulator binary at all.
 */
export function slackSection({
  title,
  account,
  slug,
  projectId,
  runtime,
  update,
  device,
  triggered,
  simulator,
  simulatorTriggered,
  error,
  simulatorError,
  simulatorRow = false,
  simulatorProfile = true,
}) {
  // The record is the run's own answer, and it is validated against the runtime it
  // was resolved for rather than the update's: a tools-only push publishes no
  // update, so keying the record to the older update's runtime would discard the
  // binary this run actually resolved. `notifySlack` only runs in CI, where the
  // file was written by this job moments earlier.
  const buildRuntime = triggered?.runtime ?? runtime;
  const { build } = pickBuild({
    device,
    triggered,
    runtime: buildRuntime,
    error,
  });
  // The simulator row answers for the simulator only: its own record, its own
  // lookup, never the device binary as a stand-in. Resolution and the "no build"
  // text use the runtime the row was resolved against, or on a tools-only push the
  // row would blame the older update's runtime for a binary it did resolve.
  const simulatorRuntime = simulatorTriggered?.runtime ?? runtime;
  const { build: sim } = pickBuild({
    triggered: simulatorTriggered,
    simulator,
    runtime: simulatorRuntime,
  });
  // Both surfaces word a missing row through `missingText`, so "no build" and
  // "lookup failed" keep meaning the same thing on each of them.
  const simulatorMissing = simulatorProfile
    ? missingText({ runtime: simulatorRuntime, error: simulatorError })
    : 'not part of a production build';

  // The build row answers for the runtime the run resolved, and says so when it
  // has nothing to link. `update:list` carries no commit (§ `updateGroups`), so
  // nothing here can claim which commit an older update came from.
  const lines = [
    update
      ? `<${updateUrl(projectId, update.group)}|Update>`
      : 'Update: none published for this commit',
    build
      ? `<${buildUrl(account, slug, build.id)}|Build>`
      : `Build: ${missingText({ runtime: buildRuntime, error })}`,
  ];

  if (simulatorRow) {
    lines.push(
      sim
        ? `<${buildUrl(account, slug, sim.id)}|Simulator Build>`
        : `Simulator Build: ${simulatorMissing}`,
    );
  }

  const shownRuntime = build ? runtimeOf(build) : buildRuntime;
  if (shownRuntime) lines.push(`_Runtime:_ \`${shownRuntime}\``);

  return {
    type: 'section',
    text: { type: 'mrkdwn', text: [title, '', ...lines].join('\n') },
  };
}

/**
 * The whole deployment message: a header, then one section per platform, with a
 * divider between them.
 *
 * This is the mapping the message's shape depends on — which platforms get a
 * row, that only iOS has a simulator row, and that the simulator row means
 * "production ships none" rather than "the lookup missed" when the profile is not
 * `preview`. Keeping it here is what lets the tests drive a profile instead of
 * re-stating its consequences.
 *
 * `updates`, `devices`, `errors` and `triggered` are keyed by platform (and
 * `${platform}/${profile}` for the records); `simulator`/`simulatorError` are the
 * iOS simulator's own lookup.
 */
export function slackBlocks({
  project,
  profile,
  account,
  slug,
  projectId,
  commit,
  message,
  updates = {},
  devices = {},
  errors = {},
  triggered = {},
  simulator,
  simulatorError,
}) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        // A main push runs both legs, and they post different binaries: without
        // the environment, two messages for one commit look like a bug.
        text: `*New code has landed in main for project ${project}!* \n*Environment:* ${
          profile.charAt(0).toUpperCase() + profile.slice(1)
        }\n*Commit:* \`${commit}\`\n*Message:* ${escapeMrkdwn(message)}`,
      },
    },
  ];

  for (const [index, platform] of PLATFORMS.entries()) {
    if (index > 0) blocks.push({ type: 'divider' });
    const ios = platform === 'ios';
    blocks.push(
      slackSection({
        // The platform headings are not bold in the message this pipeline has
        // always posted; only the header is.
        title: SLACK_LABELS[platform] ?? platform,
        account,
        slug,
        projectId,
        runtime: updates[platform]?.runtimeVersion,
        update: updates[platform],
        device: devices[platform],
        triggered: triggered[`${platform}/${profile}`],
        simulator: ios ? simulator : undefined,
        simulatorTriggered: ios
          ? triggered['ios/development-simulator']
          : undefined,
        error: errors[platform],
        simulatorError: ios ? simulatorError : undefined,
        simulatorRow: ios,
        // Production ships no simulator binary; the row says so instead of
        // vanishing.
        simulatorProfile: profile === 'preview',
      }),
    );
  }

  return blocks;
}
