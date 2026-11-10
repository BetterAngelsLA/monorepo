import { useEffect } from 'react';
import { getAnalyticsClient } from './client';

/**
 * Starts PostHog once, at the root of the app.
 *
 * Without this the client would be created by whichever screen happens to send
 * the first event, so the app-lifecycle events (installed, updated, opened) and
 * the session start would all be missing from the beginning of a session.
 * Idempotent: `getAnalyticsClient` is a singleton.
 */
export function useAnalyticsInit(): void {
  useEffect(() => {
    getAnalyticsClient();
  }, []);
}
