import { getAnalyticsClient } from './client';

/** Short on purpose: it runs in front of a navigation. */
export const ANALYTICS_FLUSH_TIMEOUT_MS = 800;

/**
 * Best-effort flush with a deadline.
 *
 * `capture()` only queues, and handing control to another app can suspend the
 * app before the batch drains — losing the event that starts a funnel while its
 * landing event still arrives. Never rejects: a failed flush must not stop a
 * user action.
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
