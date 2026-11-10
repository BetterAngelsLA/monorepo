import { useEffect } from 'react';
import { getAnalyticsClient } from './client';

/**
 * Starts PostHog once at the app root, so app-lifecycle events and the session
 * start are captured even if no screen sends anything. Idempotent.
 */
export function useAnalyticsInit(): void {
  useEffect(() => {
    getAnalyticsClient();
  }, []);
}
