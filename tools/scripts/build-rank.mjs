/**
 * Which build of a fingerprint is the one worth reporting on, in one place.
 *
 * A fingerprint can have several builds: an early failure, a retry that
 * succeeded, a duplicate someone canceled. They all share the runtime, so the
 * "newest" one is not necessarily the one that describes the fingerprint — a
 * canceled duplicate is newer than the build that finished. Rank by what the
 * build can tell you, and take the newest within a rank (EAS lists newest first,
 * so a strict `>` keeps the first of equal rank).
 *
 * This does not change reuse: `find-build.mjs` treats *any* build for a
 * fingerprint as "do not build again". It only decides which one to name.
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
