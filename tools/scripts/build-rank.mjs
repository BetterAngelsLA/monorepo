/**
 * Which build of a fingerprint to report on.
 *
 * A fingerprint can hold a failed attempt, a retry and a canceled duplicate. Rank
 * by what the build can tell you and keep the newest within a rank. This does not
 * affect reuse: `find-build.mjs` treats any build as "do not build again".
 */
export const BUILD_STATUS_RANK = {
  FINISHED: 3,
  NEW: 2,
  IN_QUEUE: 2,
  IN_PROGRESS: 2,
  ERRORED: 1,
  CANCELED: 1,
};

export function rankBuild(status) {
  return BUILD_STATUS_RANK[String(status ?? '').toUpperCase()] ?? 0;
}

export function bestBuild(builds) {
  return builds.reduce((best, build) =>
    rankBuild(build?.status) > rankBuild(best?.status) ? build : best,
  );
}

/** Terminal statuses: the build will not produce a binary without a new one. */
export function isDeadBuild(status) {
  const value = String(status ?? '').toUpperCase();
  return value === 'ERRORED' || value === 'CANCELED';
}
