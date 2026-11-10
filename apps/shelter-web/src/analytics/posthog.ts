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
     * Session recording is on for this site, and unlike the app it is DOM-based
     * (rrweb), not screenshots — so masking is per element, not per pixel.
     *
     * What that means in practice:
     *
     * - `maskAllInputs` masks every field, including the address a visitor
     *   types into the location search. It is `posthog-js`'s default; pinned
     *   because the visitor's own address is the one piece of personal data this
     *   site can receive.
     * - `blockSelector` removes the autocomplete suggestions, because those
     *   render the address as plain text rather than in an input.
     * - The map is a canvas inside the Maps SDK and records as a blank area
     *   either way, so it is not blocked — blocking it would only put a grey
     *   rectangle over the page's main content, not hide anything extra.
     */
    session_recording: {
      maskAllInputs: true,
      blockSelector: '.ph-no-capture',
    },
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
