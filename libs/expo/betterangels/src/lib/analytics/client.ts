import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';
import type { AnalyticsClient } from './clientContract';
import { analyticsConfig } from './config';

/**
 * The app's single PostHog client on native, created on first use so that
 * importing this module (a test, a build without a key) has no side effects.
 *
 * The browser has its own implementation in `client.web.ts`; Metro picks it for
 * web builds, so nothing here runs there.
 */
let client: AnalyticsClient | null | undefined;

/** The SDK types its properties as JSON; the contract only needs an object. */
type CaptureProperties = Parameters<PostHog['capture']>[1];

function toAnalyticsClient(instance: PostHog): AnalyticsClient {
  return {
    capture: (event, properties) =>
      instance.capture(event, properties as CaptureProperties),
    flush: () => instance.flush(),
    identify: (distinctId) => instance.identify(distinctId),
    /**
     * `reset()` drops the client's own state — including the properties
     * `register()`d at construction — so they are put back here. Otherwise
     * every event after the first sign-out loses `environment`, which is the
     * property the app and the shelter site are filtered on together.
     */
    reset: () => {
      instance.reset();
      instance.register(analyticsConfig.commonProperties);
    },
    getDistinctId: () => instance.getDistinctId(),
    getSessionId: () => instance.getSessionId(),
  };
}

export function getAnalyticsClient(): AnalyticsClient | null {
  if (client !== undefined) {
    return client;
  }

  const instance = analyticsConfig.enabled
    ? new PostHog(analyticsConfig.apiKey, {
        /** The default file persistence needs expo-file-system, which has no
         * web build; AsyncStorage works on every target. */
        customStorage: AsyncStorage,
        /**
         * Session replay records screenshots, since a native view hierarchy
         * cannot be reduced to a wireframe.
         *
         * The masks below are the only thing keeping client names, notes,
         * documents and photo-library content out of a recording. They are
         * SDK defaults, pinned so a default change cannot unmask them.
         * Native surfaces drawn by their own UIKit/Android layer — a PDF, a
         * camera feed, a map — are masked separately by `ReplayMask`.
         *
         * Requires `@posthog/react-native-plugin`; without it the SDK degrades
         * quietly — events send, nothing records — so Expo Go looks like
         * "replay is broken" rather than erroring. Android needs API 26+; the
         * app keeps minSdk 24, so older devices lose recordings, not the app.
         */
        /**
         * `Application Opened` carries the launch URL, and this app's deep links
         * are `betterangels://client/<id>` — a record id in an event, which
         * nothing else in this file sends.
         */
        captureAppLifecycleEvents: false,
        enableSessionReplay: true,
        sessionReplayConfig: {
          maskAllTextInputs: true,
          maskAllImages: true,
          maskAllSandboxedViews: true,
          // Console output carries API responses and debug payloads.
          captureLog: false,
          // Request URLs carry client ids in their path.
          captureNetworkTelemetry: false,
        },
      })
    : null;

  instance?.register(analyticsConfig.commonProperties);

  const analyticsClient = instance ? toAnalyticsClient(instance) : null;

  client = analyticsClient;

  return analyticsClient;
}

/**
 * Test seam: forget the singleton so a test can assert against a fresh config.
 */
export function resetAnalyticsClient(): void {
  client = undefined;
}
