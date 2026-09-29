import { useApiConfig } from '@monorepo/ba-platform';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import useAppState from '../../hooks/appState/useAppState';
import useSignOut from '../../hooks/user/useSignOut';
import { useUser } from '../../providers/user/UserProvider';
import { FeatureFlags } from '../../static';
import {
  createApiClientHmisProd,
  isAuthErrorHmisProd,
  resolveHmisProdBaseUrl,
} from '../api';

/**
 * Minimum gap between two proactive checks. `AppState` flips to `active` for
 * anything that overlays the app (share sheet, permission dialogs, the native
 * photo picker), and those shouldn't each fire a Clarity request.
 */
const SESSION_CHECK_COOLDOWN_MS = 30 * 1000;

/**
 * Upper bound for one probe. Without it, a request that never settles (a
 * stalled connection, DNS/TLS hang) would hold the in-flight guard — and
 * with it the whole watcher — open indefinitely.
 */
const SESSION_CHECK_TIMEOUT_MS = 10 * 1000;

/**
 * Proactively validates the HMIS session whenever the app comes to the
 * foreground (and once as soon as the watcher becomes active — cold start or
 * login), force-signing the user out when Clarity no longer accepts the
 * stored `auth_token`.
 *
 * Gated to HMIS prod demo users — feature flag on AND the user logged in via
 * HMIS (`isHmisUser`), since only those sessions carry a direct-HMIS token.
 *
 * Only definite session failures trigger the forced sign-out (missing token,
 * 401, 403 — `isAuthErrorHmisProd`); offline, timeout and 5xx outcomes are
 * ignored so a flaky network can't log anyone out. See
 * `HmisProdSessionWatcher` for the mount point (the HMIS clients screen).
 */
export function useHmisProdSessionWatch(): void {
  const { user } = useUser();
  const { signOut } = useSignOut();
  const hmisProdDemoEnabled = useFeatureFlagActive(FeatureFlags.HMIS_PROD_DEMO);
  const { appBecameActive } = useAppState();
  const { apiUrl: baEnvApiUrl } = useApiConfig();

  const apiClient = useMemo(
    () => createApiClientHmisProd(resolveHmisProdBaseUrl(baEnvApiUrl)),
    [baEnvApiUrl],
  );

  const enabled = hmisProdDemoEnabled && user?.isHmisUser === true;

  const checkInFlightRef = useRef(false);
  const lastCheckAtRef = useRef(0);
  const latestUserIdRef = useRef(user?.id);

  useEffect(() => {
    latestUserIdRef.current = user?.id;
  }, [user?.id]);

  const checkSession = useCallback(async () => {
    if (!enabled || checkInFlightRef.current) {
      return;
    }

    const now = Date.now();

    if (now - lastCheckAtRef.current < SESSION_CHECK_COOLDOWN_MS) {
      return;
    }

    checkInFlightRef.current = true;
    lastCheckAtRef.current = now;

    const checkedUserId = latestUserIdRef.current;
    // Abort the probe after a bounded delay so a stalled request can't hold
    // the in-flight guard open (see `SESSION_CHECK_TIMEOUT_MS`).
    const abortController = new AbortController();
    const abortTimeoutId = setTimeout(
      () => abortController.abort(),
      SESSION_CHECK_TIMEOUT_MS,
    );

    try {
      await apiClient.checkSession({ signal: abortController.signal });
    } catch (error) {
      // A slow failure must not sign out a different user than the one this
      // check started for (e.g. arriving after a manual sign-out + re-login).
      const userIsUnchanged = latestUserIdRef.current === checkedUserId;

      if (userIsUnchanged && isAuthErrorHmisProd(error)) {
        await signOut();

        // The guarded layouts also redirect to /auth once the user is null;
        // route explicitly as well so the forced logout lands on the sign-in
        // screen from any stack position.
        if (router.canGoBack?.()) {
          router.dismissAll?.();
        }

        router.replace('/auth');
      }
    } finally {
      clearTimeout(abortTimeoutId);

      checkInFlightRef.current = false;
    }
  }, [enabled, apiClient, signOut]);

  // Foreground transitions...
  useEffect(() => {
    if (appBecameActive) {
      void checkSession();
    }
  }, [appBecameActive, checkSession]);

  // ...plus one check as soon as the watcher applies (cold start, login).
  useEffect(() => {
    if (enabled) {
      void checkSession();
    }
  }, [enabled, checkSession]);
}
