/**
 * Guardship for the reload the prompt offers.
 *
 * `version.json` and `index.html` are uploaded together but reach a given edge
 * independently, and a reload can be prevented outright (an embedded webview, an
 * extension, a future `beforeunload` guard on the note form). Without a guard,
 * a user who reloads the moment the prompt appears can land on the *old* HTML for
 * a deployment that is still propagating, see the prompt again seconds later,
 * and reload in a loop — discarding whatever they were doing each time.
 *
 * The record is keyed by the build that was deployed when the reload happened,
 * not just by time:
 *
 * - a *newer* deployment clears the suppression immediately, because a fresh id
 *   means the previous attempt was not futile and is worth offering again;
 * - the same deployment keeps it suppressed for the window, so the loop cannot
 *   form;
 * - the window is a fallback, not the mechanism, so a reload that silently did
 *   nothing cannot hide the prompt indefinitely.
 *
 * `sessionStorage` rather than memory: the reload it guards against is a full
 * document load, which wipes memory. It is per-tab, which is the right scope —
 * another tab is not part of this loop.
 */

export const RELOAD_GUARD_KEY = 'web-update:reloaded-at';

/** How long after a reload attempt the prompt stays quiet for the same build. */
export const RELOAD_GUARD_MS = 10 * 60 * 1000;

type TGuardRecord = {
  /** The deployment the user was looking at when they reloaded. */
  buildId: string;
  /** When, for the window fallback. */
  at: number;
};

/**
 * Storage can be unavailable (SSR, Safari private mode, a blocked origin).
 * The guard is a nicety, so every failure degrades to "no guard" rather than
 * breaking the update check.
 */
const read = (): TGuardRecord | null => {
  try {
    const raw = globalThis.sessionStorage?.getItem(RELOAD_GUARD_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as TGuardRecord;

    return typeof parsed?.buildId === 'string' && Number.isFinite(parsed?.at)
      ? parsed
      : null;
  } catch {
    return null;
  }
};

/** Record that a reload was attempted against `buildId`. */
export const markReloadAttempt = (
  buildId: string,
  now: number = Date.now(),
): void => {
  try {
    const record: TGuardRecord = { buildId, at: now };

    globalThis.sessionStorage?.setItem(RELOAD_GUARD_KEY, JSON.stringify(record));
  } catch {
    /* non-critical */
  }
};

/**
 * Whether a prompt for `deployedBuildId` should stay suppressed.
 *
 * The clock comparison is two-sided on purpose: a wall clock that moved
 * *backwards* (NTP correction, a restored tab) would otherwise make `now - at`
 * negative and suppress the prompt for as long as it takes to catch up.
 */
export const isReloadGuardActive = (
  deployedBuildId: string | null,
  now: number = Date.now(),
): boolean => {
  const record = read();

  if (!record || !deployedBuildId) return false;

  // A different id means a new deployment landed after the attempt: offer it.
  if (record.buildId !== deployedBuildId) return false;

  const elapsed = now - record.at;

  return elapsed >= 0 && elapsed < RELOAD_GUARD_MS;
};
