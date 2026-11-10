import posthog from 'posthog-js';

/**
 * PostHog for the public shelter site.
 *
 * This app is anonymous — there is no sign-in to join on — so a visit is only
 * linked to an outreach-app session when the app hands one over in the URL
 * fragment. The outreach app writes `ba_did` / `ba_sid` (see
 * `libs/expo/betterangels/src/lib/analytics/shelterHandoff.ts`); this file
 * feeds them into `bootstrap`, which makes the landing page continue that
 * session instead of starting a new one.
 *
 * The event name is the second half of a funnel whose first half is
 * `shelter_search_opened` in the app. Renaming either one breaks the funnel
 * silently, so keep them together.
 */
const SHELTER_SEARCH_LANDED_EVENT = 'shelter_search_landed';

const HANDOFF_DISTINCT_ID_PARAM = 'ba_did';
const HANDOFF_SESSION_ID_PARAM = 'ba_sid';

type Handoff = {
  distinctId?: string;
  sessionId?: string;
};

function readHandoff(hash: string): Handoff {
  const params = new URLSearchParams(hash.replace(/^#/, ''));

  return {
    distinctId: params.get(HANDOFF_DISTINCT_ID_PARAM) ?? undefined,
    sessionId: params.get(HANDOFF_SESSION_ID_PARAM) ?? undefined,
  };
}

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
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn(
        '[analytics] VITE_POSTHOG_API_KEY is not set; analytics is disabled.',
      );
    }

    return;
  }

  const handoff = readHandoff(window.location.hash);
  const isHandoff = Boolean(handoff.distinctId || handoff.sessionId);

  stripHandoffFromUrl();

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
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
  });

  posthog.register({
    app: 'shelter-web',
    environment: import.meta.env.MODE,
  });

  posthog.capture(SHELTER_SEARCH_LANDED_EVENT, {
    handoff: isHandoff,
    entry_path: `${window.location.pathname}${window.location.search}`,
  });
}
