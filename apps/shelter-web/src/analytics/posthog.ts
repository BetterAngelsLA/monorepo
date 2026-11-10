import {
  ShelterSearchEvent,
  decodeShelterHandoff,
  type ShelterHandoff,
} from '@monorepo/shared/shelter-handoff';
import type { PostHogConfig } from 'posthog-js';

/**
 * PostHog for the public shelter site.
 *
 * The site is anonymous, so a visit joins an outreach-app session only when the
 * app hands one over in the URL fragment. This is the receiving half of that
 * contract; the parameter names, decoder and funnel event names come from
 * `@monorepo/shared/shelter-handoff`.
 */

/** Drops the fragment before anything captures a URL, so the handoff id never
 * reaches `$current_url` or a `Referer`. */
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
   * Loaded on demand to keep posthog-js off the main thread of a map-heavy page;
   * `$pageview` therefore lands a moment after load.
   *
   * For e2e: posthog-js silently drops traffic whose user agent,
   * `userAgentData.brands` or `navigator.webdriver` looks automated, so a
   * Playwright run needs `opt_out_useragent_filter: true`.
   */
  void import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(apiKey, buildInitConfig({ handoff }));

      posthog.register({ app: 'shelter-web' });

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

/** Options for `posthog.init`, factored out so the privacy decisions below can
 * be asserted in a test. */
export function buildInitConfig({
  handoff,
}: {
  handoff: ShelterHandoff;
}): Partial<PostHogConfig> {
  return {
    // Pin the config-era rather than inheriting whatever the SDK does by
    // default, so a dependency bump cannot change capture behaviour silently.
    defaults: '2026-08-30',
    /**
     * Replay here is DOM-based (rrweb), so masking is per element rather than
     * per pixel.
     *
     * `maskAllInputs` covers the address a visitor types into the location
     * search — the one piece of personal data this site receives — and is
     * pinned despite being the default. The autocomplete renders that address as
     * text rather than in an input, so it is blocked instead.
     *
     * The map is a canvas and records blank either way; blocking it would only
     * put a grey rectangle over the page's main content.
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
            // The app only hands over an id after `identify(user.id)`, so this
            // is a known person; without it the visit lands as anonymous and
            // never attaches to that profile.
            isIdentifiedID: true,
          },
        }
      : {}),
  };
}
