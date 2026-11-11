import { useApiConfig } from '@monorepo/ba-platform';
import { withShelterHandoff } from '@monorepo/shared/shelter-handoff';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  AnalyticsEvent,
  ShelterSearchSource,
  flushAnalytics,
  useAnalytics,
} from '../analytics';
import { shelterHomeUrl } from './shelterDirectory';

/**
 * The shelter site this build may open, or `null` where it has none.
 *
 * Read separately from the opener so an entry point can hide itself instead of
 * offering a button that cannot go anywhere.
 */
export function useShelterHomeUrl(): string | null {
  const { apiUrl } = useApiConfig();

  return shelterHomeUrl(apiUrl, process.env['EXPO_PUBLIC_SHELTER_WEB_URL']);
}

/**
 * Whether to drain the queue before opening the browser.
 *
 * Native only. There the in-app browser takes the foreground and can suspend
 * the app before the batch timer fires, losing the event that starts a funnel.
 * On web the page stays open in another tab — and awaiting here would spend the
 * user activation `window.open` needs, which a strict browser turns into a
 * blocked popup (`ERR_WEB_BROWSER_BLOCKED`).
 */
export function shouldFlushBeforeOpen(platform: string): boolean {
  return platform !== 'web';
}

/**
 * The one place that leaves this app for the shelter site.
 *
 * Every entry point — the client profile and the client picker — has to do the
 * same three things in one press: record the departure, get the batch off the
 * device before the browser takes over the foreground, and carry the analytics
 * identity across in the fragment. Sharing that here keeps the two entry points
 * from drifting, and lets `source` alone distinguish them.
 */
export function useOpenShelterSearch(source: ShelterSearchSource) {
  const url = useShelterHomeUrl();
  const { capture, getIdentity } = useAnalytics();
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  /**
   * The guard `opening` state cannot be.
   *
   * Two presses in the same tick both read the state from the same render and
   * both pass: the second opens a second tab and sends a second event. A ref is
   * updated immediately, so only the first gets through; the state stays for
   * rendering the control as busy.
   */
  const openingRef = useRef(false);

  const open = useCallback(async () => {
    // A second press while the first is still opening would add a second tab and
    // a second `opened` event, and the second popup is the one a browser blocks.
    if (!url || openingRef.current) return;

    openingRef.current = true;
    setOpening(true);
    setError(false);

    const identity = getIdentity();

    capture(AnalyticsEvent.ShelterSearchOpened, {
      source,
      handoff: Boolean(identity.sessionId),
      handoff_person: Boolean(identity.distinctId),
    });

    try {
      if (shouldFlushBeforeOpen(Platform.OS)) {
        await flushAnalytics();
      }

      await WebBrowser.openBrowserAsync(withShelterHandoff(url, identity));
    } catch {
      // No landing event will follow this press, so say so rather than leaving
      // a start with no end.
      capture(AnalyticsEvent.ShelterSearchFailed, { source });
      setError(true);
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
  }, [url, source, capture, getIdentity]);

  return { open, error, opening, canOpen: Boolean(url) };
}
