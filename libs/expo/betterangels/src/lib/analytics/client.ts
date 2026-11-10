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
          /**
           * AsyncStorage is the only persistence backend that works on every
           * target this app ships to. The SDK's default file persistence needs
           * expo-file-system, which has no web build.
           */
          customStorage: AsyncStorage,
          /**
           * Session replay.
           *
           * On for this app by decision: it is a logged-in staff tool, and
           * client data is masked below and by `ReplayMask`. The public shelter
           * site deliberately does NOT record — see
           * `apps/shelter-web/src/analytics/posthog.ts`.
           *
           * It requires `@posthog/react-native-plugin`, a native module, so
           * **Expo Go cannot load it**: use a development build. Without the
           * plugin the SDK degrades quietly — events still send, nothing
           * records — so a missing dev build looks like "replay is broken"
           * rather than an error.
           *
           * It records screenshots, because a React Native view hierarchy
           * cannot be serialised into a wireframe, and the masking flags below
           * are this SDK's defaults set explicitly: they are the only thing
           * keeping client names, notes, uploaded documents and photo-library
           * content out of a recording. A future default change must not
           * silently unmask a vulnerable population's data.
           *
           * Needs Android API 26+ at runtime. The app keeps Expo's default
           * minSdk (24), so older devices lose recordings, not the app — do not
           * raise minSdkVersion for this.
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
