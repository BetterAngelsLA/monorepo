/**
 * The surface a platform's PostHog client has to provide.
 *
 * There are two implementations, because they are two different SDKs:
 * `client.ts` wraps `posthog-react-native` (native), `client.web.ts` wraps
 * `posthog-js` (browser). The React Native SDK sends events on web but records
 * nothing — its recorder captures native views and it has no DOM implementation
 * — so the browser gets the SDK that ships one.
 *
 * Everything above this type (identity, flush, the hooks) is platform-agnostic
 * and must go through it rather than through either package.
 */
export type AnalyticsClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  flush: () => Promise<void>;
  identify: (distinctId: string) => void;
  reset: () => void;
  getDistinctId: () => string | undefined;
  getSessionId: () => string | undefined;
};
