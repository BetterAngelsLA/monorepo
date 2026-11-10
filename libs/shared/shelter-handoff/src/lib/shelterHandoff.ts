/**
 * The contract between the outreach app and the shelter site.
 *
 * One app writes these strings into a URL, the other reads them out. Nothing
 * type-checks across that gap and nothing throws when they disagree — the
 * handoff simply stops joining sessions and the funnel under-reports. Hence one
 * module, no framework dependency, so Metro and Vite both consume it.
 */

/**
 * PostHog's bootstrap options are `distinctID`/`sessionID`; these are the URL
 * parameters that carry them. Fragment, not query string: never sent to the
 * server, never in a `Referer`.
 */
export const HANDOFF_DISTINCT_ID_PARAM = 'ba_did';
export const HANDOFF_SESSION_ID_PARAM = 'ba_sid';

export type ShelterHandoff = {
  distinctId?: string | null;
  sessionId?: string | null;
};

/**
 * Manual rather than `URLSearchParams`: identical output on every runtime, and
 * no stray `&` for a missing parameter.
 */
export function encodeShelterHandoff(handoff: ShelterHandoff): string {
  const pairs: string[] = [];

  if (handoff.distinctId) {
    pairs.push(
      `${HANDOFF_DISTINCT_ID_PARAM}=${encodeURIComponent(handoff.distinctId)}`,
    );
  }

  if (handoff.sessionId) {
    pairs.push(
      `${HANDOFF_SESSION_ID_PARAM}=${encodeURIComponent(handoff.sessionId)}`,
    );
  }

  return pairs.join('&');
}

/**
 * Expects a URL with no query or fragment. Returns it untouched when there is
 * no identity to carry, so a build without analytics still opens the site.
 */
export function withShelterHandoff(
  url: string,
  handoff: ShelterHandoff,
): string {
  const fragment = encodeShelterHandoff(handoff);

  return fragment ? `${url}#${fragment}` : url;
}

/** Reads a `window.location.hash` value, with or without the leading `#`. */
export function decodeShelterHandoff(hash: string): ShelterHandoff {
  const params = new URLSearchParams(hash.replace(/^#/, ''));

  return {
    distinctId: params.get(HANDOFF_DISTINCT_ID_PARAM) ?? undefined,
    sessionId: params.get(HANDOFF_SESSION_ID_PARAM) ?? undefined,
  };
}
