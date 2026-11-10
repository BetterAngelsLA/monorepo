import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';
import { analyticsConfig } from './config';

let client: PostHog | null | undefined;

/**
 * Expo's web export evaluates this module in Node during static rendering,
 * where there is neither a `window` nor storage. New Relic guards the same
 * boundary in `apps/betterangels/src/monitoring/newRelic.web.ts`; do it here so
 * a server render can never construct a half-initialised client.
 */
function hasRuntime(): boolean {
  return Platform.OS !== 'web' || typeof window !== 'undefined';
}

/**
 * The one PostHog client for the app, created on first use.
 *
 * Created lazily rather than at import time so that importing this file in a
 * test, a Node render, or a build without a key has no side effects.
 */
export function getAnalyticsClient(): PostHog | null {
  if (client !== undefined) {
    return client;
  }

  client =
    analyticsConfig.enabled && hasRuntime()
      ? new PostHog(analyticsConfig.apiKey, {
          host: analyticsConfig.host,
          /**
           * AsyncStorage is the only persistence backend that works on every
           * target this app ships to. The SDK's default file persistence needs
           * expo-file-system, which has no web build.
           */
          customStorage: AsyncStorage,
          /**
           * Session replay records screenshots, because a React Native view
           * hierarchy cannot be serialised into a wireframe. The masking flags
           * below are the SDK defaults for this SDK, but they are set
           * explicitly: they are the only thing keeping client names, notes,
           * uploaded documents and photo-library content out of a recording,
           * and a future default change must not silently unmask a vulnerable
           * population's data. See docs/analytics.md before relaxing one.
           */
          enableSessionReplay: Platform.OS !== 'web',
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

  client?.register(analyticsConfig.commonProperties);

  return client;
}

/**
 * Test seam: forget the singleton so a test can assert against a fresh config.
 */
export function resetAnalyticsClient(): void {
  client = undefined;
}
