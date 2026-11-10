import AsyncStorage from '@react-native-async-storage/async-storage';
import { POSTHOG_PROXY_HOST } from '@monorepo/shared/shelter-handoff';
import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';
import { analyticsConfig } from './config';

let client: PostHog | null | undefined;

/**
 * Expo's web export evaluates this module in Node, with no `window` and no
 * storage; a static render must not construct a client.
 */
function hasRuntime(): boolean {
  return Platform.OS !== 'web' || typeof window !== 'undefined';
}

/**
 * The app's single PostHog client, created on first use so that importing this
 * module (a test, a Node render, a build without a key) has no side effects.
 */
export function getAnalyticsClient(): PostHog | null {
  if (client !== undefined) {
    return client;
  }

  client =
    analyticsConfig.enabled && hasRuntime()
      ? new PostHog(analyticsConfig.apiKey, {
          /**
           * The web build is a browser, so it faces the same blockers as the
           * shelter site and goes through the same first-party proxy. Native
           * does not: no browser, no blocker, no CORS.
           */
          ...(Platform.OS === 'web' ? { host: POSTHOG_PROXY_HOST } : {}),
          /** The default file persistence needs expo-file-system, which has no
           * web build; AsyncStorage works on every target. */
          customStorage: AsyncStorage,
          /**
           * Session replay records screenshots, since an RN view hierarchy
           * cannot be reduced to a wireframe.
           *
           * The masks below are the only thing keeping client names, notes,
           * documents and photo-library content out of a recording. They are
           * SDK defaults, pinned so a default change cannot unmask them.
           * Native surfaces are masked separately by `ReplayMask`.
           *
           * Requires `@posthog/react-native-plugin`; without it the SDK degrades
           * quietly — events send, nothing records — so Expo Go looks like
           * "replay is broken" rather than erroring. Android needs API 26+; the
           * app keeps minSdk 24, so older devices lose recordings, not the app.
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
