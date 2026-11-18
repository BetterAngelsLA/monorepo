import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { fetchDeployedBuildId } from './fetchDeployedBuildId';

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
  const lastCheckRef = useRef(0);
  const isCheckingRef = useRef(false);

  const check = useCallback(async () => {
    if (!ownBuildId || isCheckingRef.current) return;

    isCheckingRef.current = true;

    try {
      const deployedBuildId = await fetchDeployedBuildId();

      if (!deployedBuildId) return;

      lastCheckRef.current = Date.now();

      if (deployedBuildId !== ownBuildId) {
        setUpdateAvailable(true);
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

    const interval = setInterval(() => void check(), POLL_INTERVAL_MS);

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

  return { updateAvailable, dismissed, dismiss };
}
