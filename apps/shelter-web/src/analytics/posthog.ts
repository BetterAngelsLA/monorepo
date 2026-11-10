import {
  ShelterSearchEvent,
  decodeShelterHandoff,
  type ShelterHandoff,
} from '@monorepo/shared/shelter-handoff';

/**
 * PostHog for the public shelter site.
 *
 * This app is anonymous — there is no sign-in to join on — so a visit is only
 * linked to an outreach-app session when the app hands one over in the URL
 * fragment. The outreach app writes `ba_did` / `ba_sid`; this file feeds them
 * into `bootstrap`, which makes the landing page continue that session instead
 * of starting a new one.
 *
 * The parameter names, the event name and the decoder all come from
 * `@monorepo/shared/shelter-handoff`, which the app writes with — that module is the
 * contract, this one is only this app's half of it.
 */

/**
 * Drops the fragment from the address bar before anything captures a URL.
 *
 * Without this the handoff id would land in `$current_url` on every event and
 * in the referrer if the visitor navigates away.
 */
function stripHandoffFromUrl(): void {
  const { pathname, search } = window.location;

  window.history.replaceState(null, '', `${pathname}${search}`);
}

export function initAnalytics(): void {
  const handoff = decodeShelterHandoff(window.location.hash);
  const isHandoff = Boolean(handoff.distinctId || handoff.sessionId);

  // Before the key check: the fragment is an identifier in the address bar
  // whether or not this build can send events, so it always comes out.
  if (isHandoff) {
    stripHandoffFromUrl();
  }

  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn(
        '[analytics] VITE_POSTHOG_API_KEY is not set; analytics is disabled.',
      );
    }

    return;
  }

  /**
   * Loaded on demand so posthog-js stays out of the first chunk. This page is
   * a map, and the analytics bundle has no business competing with it for the
   * main thread before first paint. The cost is that `$pageview` is captured a
   * moment after load rather than during it.
   *
   * Note for end-to-end tests: posthog-js drops traffic whose user agent,
   * `userAgentData.brands` or `navigator.webdriver` looks automated, silently.
   * A Playwright run needs `opt_out_useragent_filter: true` to observe
   * anything.
   */
  void import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(apiKey, buildInitConfig({ handoff }));

      posthog.register({
        app: 'shelter-web',
        environment: import.meta.env.MODE,
      });

      posthog.capture(ShelterSearchEvent.Landed, {
        handoff: Boolean(handoff.sessionId),
        handoff_person: Boolean(handoff.distinctId),
        entry_path: window.location.pathname,
      });
    })
    .catch(() => {
      // Analytics must never break the page it is measuring.
    });
}

/**
 * The options handed to `posthog.init`, factored out so the parts that are a
 * privacy or contract decision can be asserted in a test rather than only read.
 */
export function buildInitConfig({ handoff }: { handoff: ShelterHandoff }) {
  return {
    /**
     * Never record this site, even when the PostHog project has session
     * recordings switched on.
     *
     * Recording here is not a config tweak: shelter.betterangels.la is public,
     * renders the visitor's own location on a map, and is reached from a client
     * record in the app. Turning project-level replay on would otherwise start
     * recording it silently, because this is the posthog-js default. Enabling
     * it would be a deliberate change with its own review.
     */
    disable_session_recording: true,
    // Continue the app's session when it handed one over. `sessionID` is only
    // meaningful alongside `distinctID`.
    ...(handoff.distinctId
      ? {
          bootstrap: {
            distinctID: handoff.distinctId,
            sessionID: handoff.sessionId,
          },
        }
      : {}),
  };
}
