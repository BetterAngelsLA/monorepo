import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { fetchDeployedBuildId } from './fetchDeployedBuildId';
import { isReloadGuardActive, markReloadAttempt } from './reloadGuard';

/**
 * How often a visible tab asks whether it is still current.
 *
 * Ten minutes is a compromise: frequent enough that a caseworker who leaves the
 * app open all day is not stuck on last week's bundle for the rest of the day,
 * rare enough that it is one small `no-store` request per tab per ten minutes.
 */
export const POLL_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Ignore a return-to-tab check that follows the poll that just ran. Switching
 * windows back and forth should not turn into a burst of requests.
 */
export const MIN_RECHECK_INTERVAL_MS = 60 * 1000;

/**
 * How many leading characters of a build id are compared.
 *
 * The same commit is spelled at different lengths on the two sides — the bundle
 * carries whatever `EXPO_PUBLIC_BUILD_ID` held at export time, while
 * `version.json` is written by the deploy — so comparing prefixes makes a length
 * difference harmless. Twelve hex characters identify a commit for every
 * practical purpose.
 */
export const COMPARABLE_BUILD_ID_LENGTH = 12;

/**
 * What a build id is allowed to look like.
 *
 * Both sides must be a commit sha. A comparison between arbitrary strings is
 * worse than no comparison: a deployment that published `2026.11.17` (or a
 * branch name) would compare *equal* to itself forever, silently disabling the
 * feature, while a one-off typo would prompt every tab forever. Anything that is
 * not a sha is treated as "cannot tell", which is safe.
 */
const BUILD_ID_PATTERN = /^[0-9a-f]{7,40}$/i;

export const isComparableBuildId = (value: string | null | undefined): boolean =>
  typeof value === 'string' && BUILD_ID_PATTERN.test(value.trim());

let hasWarnedAboutUnusableId = false;

const warnOnceAboutUnusableId = (value: string) => {
  if (hasWarnedAboutUnusableId) return;

  hasWarnedAboutUnusableId = true;
  console.warn(
    `[WebUpdatePrompt] build id ${JSON.stringify(value)} is not a commit sha; the update check is disabled for this session.`,
  );
};

const normalizeBuildId = (value: string) =>
  value.trim().toLowerCase().slice(0, COMPARABLE_BUILD_ID_LENGTH);

/**
 * Is the running build behind the deployment?
 *
 * Missing or unusable inputs are "no": a bundle built without an id (a dev
 * server, or a deployment that predates `version.json`) must never compare
 * against nothing and interrupt the user.
 */
export const isStaleBuild = (
  ownBuildId: string | undefined,
  deployedBuildId: string | null,
): boolean => {
  if (!ownBuildId || !deployedBuildId) return false;

  if (!isComparableBuildId(ownBuildId) || !isComparableBuildId(deployedBuildId)) {
    warnOnceAboutUnusableId(
      isComparableBuildId(ownBuildId) ? deployedBuildId : ownBuildId,
    );

    return false;
  }

  return normalizeBuildId(ownBuildId) !== normalizeBuildId(deployedBuildId);
};

/**
 * Whether the running build is stale, and how to act on it.
 *
 * Web only: native already has `expo-updates` behind `AppUpdatePrompt`, and
 * that path is inert in a browser (there is no OTA channel there), which is why
 * a tab could sit on an old bundle indefinitely. This closes that gap.
 *
 * `ownBuildId` is the id compiled into this bundle. When it is undefined the
 * bundle was built without one (a dev server, or a build predating the id), and
 * every comparison would be meaningless — so nothing is ever reported.
 */
export function useWebUpdateCheck(ownBuildId: string | undefined) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deployedBuildId, setDeployedBuildId] = useState<string | null>(null);
  const lastCheckRef = useRef(0);
  const isCheckingRef = useRef(false);

  const check = useCallback(async (reArmDismissal = false) => {
    if (!ownBuildId || isCheckingRef.current) return;

    isCheckingRef.current = true;

    // Recorded on the attempt, not the success: an offline tab would otherwise
    // never advance this clock and would re-check on every focus.
    lastCheckRef.current = Date.now();

    try {
      const deployed = await fetchDeployedBuildId();

      if (!deployed) return;

      setDeployedBuildId(deployed);

      // We just reloaded for this deployment; give the edge time to settle
      // rather than offering a reload that would land on the same bundle again.
      if (isReloadGuardActive(deployed)) return;

      if (isStaleBuild(ownBuildId, deployed)) {
        setUpdateAvailable(true);

        // Only a scheduled poll re-arms a "Not now". Doing it on every check
        // would turn returning to the tab into a nag; doing it never would let
        // one dismissal hide a stale build for the tab's whole life, which is
        // the outcome this feature exists to prevent.
        if (reArmDismissal) setDismissed(false);
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [ownBuildId]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !ownBuildId) return;

    // A tab restored from a previous session is stale from its first paint, so
    // check immediately instead of waiting out the first interval.
    void check();

    const interval = setInterval(() => void check(true), POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (Date.now() - lastCheckRef.current < MIN_RECHECK_INTERVAL_MS) return;

      void check();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [check, ownBuildId]);

  const dismiss = useCallback(() => setDismissed(true), []);

  /**
   * Called by the prompt before reloading. Keyed on the deployment the user was
   * looking at, so a *newer* deployment clears the suppression immediately.
   */
  const noteReloadAttempt = useCallback(() => {
    if (deployedBuildId) markReloadAttempt(deployedBuildId);
  }, [deployedBuildId]);

  return { updateAvailable, dismissed, dismiss, noteReloadAttempt };
}
