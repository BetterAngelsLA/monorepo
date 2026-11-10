import { getAnalyticsClient } from './client';

/**
 * How long a screen may wait for its own event to reach PostHog before
 * continuing. Short on purpose: this runs in front of a navigation.
 */
export const ANALYTICS_FLUSH_TIMEOUT_MS = 800;

/**
 * Best-effort flush with a deadline.
 *
 * `capture()` only queues: the client batches (`flushAt` 20, `flushInterval`
 * 10s). When the next thing a screen does is hand control to another app — as
 * the shelter button does by opening a browser — the queue can be suspended
 * before it drains, and the event that marks the start of a journey is the one
 * that gets lost. The destination's event still arrives, so the funnel
 * under-counts conversions rather than showing an error.
 *
 * Never rejects and never throws: a failed flush must not stop a user action.
 */
export async function flushAnalytics(
  timeoutMs: number = ANALYTICS_FLUSH_TIMEOUT_MS,
): Promise<void> {
  const client = getAnalyticsClient();

  if (!client) {
    return;
  }

  await Promise.race([
    client.flush().catch(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}
