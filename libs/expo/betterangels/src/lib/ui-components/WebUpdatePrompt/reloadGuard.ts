/**
 * Guardship for the reload the prompt offers.
 *
 * `version.json` and `index.html` are uploaded together but reach a given edge
 * independently. A user who reloads the moment the prompt appears can therefore
 * land on the *old* HTML for a deployment that is still propagating, see the
 * prompt again seconds later, and reload in a loop — discarding whatever they
 * were doing each time.
 *
 * So a reload is recorded, and no prompt is offered again for a while: long
 * enough for a propagation to settle, short enough that a genuinely missed
 * update is still offered later in the same session.
 *
 * `sessionStorage` rather than memory: the reload it guards against is a full
 * document load, which wipes memory. It is per-tab, which is the right scope —
 * another tab is not part of this loop.
 */

export const RELOAD_GUARD_KEY = 'web-update:reloaded-at';

/** How long after a reload attempt the prompt stays quiet. */
export const RELOAD_GUARD_MS = 10 * 60 * 1000;

/**
 * Storage can be unavailable (SSR, Safari private mode, a blocked origin).
 * The guard is a nicety, so every failure degrades to "no guard" rather than
 * breaking the update check.
 */
const read = (): number | null => {
  try {
    const raw = globalThis.sessionStorage?.getItem(RELOAD_GUARD_KEY);

    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
};

/** Record that a reload was just attempted, so the prompt does not repeat it. */
export const markReloadAttempt = (now: number = Date.now()): void => {
  try {
    globalThis.sessionStorage?.setItem(RELOAD_GUARD_KEY, String(now));
  } catch {
    /* non-critical */
  }
};

/** Whether a prompt should stay suppressed because we just reloaded. */
export const isReloadGuardActive = (now: number = Date.now()): boolean => {
  const attemptedAt = read();

  if (attemptedAt === null || !Number.isFinite(attemptedAt)) return false;

  return now - attemptedAt < RELOAD_GUARD_MS;
};
