import { useCallback } from 'react';
import { getAnalyticsClient } from './client';
import type { AnalyticsEventName, AnalyticsEventProperties } from './events';
import type { ShelterHandoff } from './shelterHandoff';

type Capture = <E extends AnalyticsEventName>(
  event: E,
  properties?: AnalyticsEventProperties[E],
) => void;

type GetIdentity = () => ShelterHandoff;

/**
 * Sends one event, or does nothing when analytics is not configured.
 *
 * Call sites stay free of `client === null` branches: a build without a key, a
 * custom dev build, and an offline device all fall through here without
 * changing what the screen does.
 */
export function useAnalytics(): {
  capture: Capture;
  getIdentity: GetIdentity;
} {
  const capture = useCallback<Capture>((event, properties) => {
    getAnalyticsClient()?.capture(event, properties);
  }, []);

  /**
   * The identity to hand to another property. Read at press time, not render
   * time, so a `reset()`/sign-out between those two moments cannot send a
   * stale session.
   */
  const getIdentity = useCallback<GetIdentity>(() => {
    const client = getAnalyticsClient();

    return {
      distinctId: client?.getDistinctId(),
      sessionId: client?.getSessionId(),
    };
  }, []);

  return { capture, getIdentity };
}
