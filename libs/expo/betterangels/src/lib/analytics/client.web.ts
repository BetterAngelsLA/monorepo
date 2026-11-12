import {
  POSTHOG_PROXY_HOST,
  POSTHOG_UI_HOST,
} from '@monorepo/shared/shelter-handoff';
import posthog, { type PostHogConfig } from 'posthog-js';
import type { AnalyticsClient } from './clientContract';
import { analyticsConfig } from './config';

/**
 * PostHog for the app's web build.
 *
 * A separate implementation from `client.ts`, not a config branch: the React
 * Native SDK records by capturing native views, depends only on
 * `@posthog/core` and ships no rrweb, so on web it delivered events and zero
 * snapshots without logging anything. `posthog-js` is the SDK that has a DOM
 * recorder — and it is also the one whose capture defaults have to be turned
 * off for a surface that renders client records.
 */
let client: AnalyticsClient | null | undefined;

/**
 * Options for `posthog-js`, factored out so the privacy decisions below can be
 * asserted in a test.
 */
export function webAnalyticsConfig(): Partial<PostHogConfig> {
  return {
    // Through the same first-party proxy as the shelter site, so a blocker that
    // matches PostHog's domains does not silently drop the app's events.
    api_host: POSTHOG_PROXY_HOST,
    ui_host: POSTHOG_UI_HOST,
    // Pin the config-era rather than inheriting whatever the SDK does by
    // default, so a dependency bump cannot change capture behaviour silently.
    defaults: '2026-08-30',
    /**
     * Replay stays off here even though this SDK can now do it.
     *
     * This build renders client names, notes, dates of birth and document
     * previews as DOM. `posthog-react-native` could not record any of it, so
     * turning recording on is a decision about masking every one of those
     * surfaces — not something a config change should make on its own. The
     * masks below are where a deliberate enablement would start, and they are
     * not sufficient yet: `ReplayMask` is a `View` with an accessibility label,
     * which rrweb cannot match, so images behind one need a DOM block class
     * before recording this surface is safe.
     */
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      // `*` masks every text node, i.e. the client names and note bodies.
      maskTextSelector: '*',
      blockSelector: '.ph-no-capture',
    },
    /**
     * Both default on, and both ship the page URL: on a client profile that
     * carries the client id in the path, and on autocapture it also carries the
     * text of whatever was clicked.
     */
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    // localStorage rather than the default cookie jar: nothing else on this
    // origin needs the id, and no cookie is set in a staff browser.
    persistence: 'localStorage',
  };
}

/**
 * `posthog-js` names its accessors differently from the React Native SDK, and
 * its types omit `flush()` even though the instance has one after `init()`.
 */
function toAnalyticsClient(instance: typeof posthog): AnalyticsClient {
  return {
    capture: (event, properties) => instance.capture(event, properties),
    flush: async () => {
      const flush = (instance as { flush?: () => Promise<void> }).flush;

      await flush?.call(instance);
    },
    identify: (distinctId) => instance.identify(distinctId),
    /** Same reason as the native client: `reset()` drops registered props. */
    reset: () => {
      instance.reset();
      instance.register(analyticsConfig.commonProperties);
    },
    getDistinctId: () => instance.get_distinct_id(),
    getSessionId: () => instance.get_session_id(),
  };
}

export function getAnalyticsClient(): AnalyticsClient | null {
  if (client !== undefined) {
    return client;
  }

  // A static render has no browser to measure; answer with "nothing to send to"
  // rather than constructing a client against a missing `window`.
  if (!analyticsConfig.enabled || typeof window === 'undefined') {
    client = null;

    return client;
  }

  posthog.init(analyticsConfig.apiKey, webAnalyticsConfig());
  posthog.register(analyticsConfig.commonProperties);

  client = toAnalyticsClient(posthog);

  return client;
}

/**
 * Test seam: forget the singleton so a test can assert against a fresh config.
 */
export function resetAnalyticsClient(): void {
  client = undefined;
}
