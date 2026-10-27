/**
 * The "Build Details" cell of the PR preview comment.
 *
 * A preview run only builds what the change needs: a JS-only change ships
 * through the EAS Update, so it builds android and the iOS simulator and skips
 * the iOS device build (see .github/workflows/preview.yml). The comment still
 * has to tell a reviewer where each platform's binary is, and a fingerprint
 * builds once — so the binary for this runtime usually exists already, even
 * when this run did not build it.
 *
 * `eas-deploy.ts` solved that by triggering a build whenever one was missing and
 * linking the object `eas build --json` returned. Splitting it into
 * `build-missing.ts` + `eas-preview-comment.mjs` dropped both halves: the
 * trigger result is discarded, and the lookup is keyed on what this run built
 * instead of what exists for the runtime. So resolve, in order:
 *
 *   1. a device build that exists for this runtime — this run's or an earlier one,
 *   2. the build this run queued, recorded in `.eas-builds.json` by
 *      `build-missing.ts` (its link is valid the moment EAS answers, before
 *      `build:list` lists it),
 *   3. the iOS simulator binary, the artifact a reviewer on a laptop installs,
 *   4. an explicit "no build for <runtime>" / "lookup failed" — never a bare N/A.
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

/** Which binary the cell shows, and what it says about where it came from. */
const pick = ({
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
  const { build, note } = pick({
    device,
    triggered,
    simulator,
    simulatorTriggered,
    runtime,
    error,
  });
  if (!build) {
    const which = runtime ? `\`${runtime}\`` : 'this runtime';
    return error
      ? `Lookup failed for ${which} — see the job log`
      : `No build for ${which}`;
  }

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
