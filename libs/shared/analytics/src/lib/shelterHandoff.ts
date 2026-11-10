/**
 * The contract between the outreach app and the shelter site.
 *
 * These strings are written into a URL by one app and read out of it by the
 * other. Nothing type-checks across that boundary and nothing throws when they
 * disagree — the visit simply stops being joined to the session that sent it,
 * the funnel under-reports, and every dashboard still looks healthy. That is
 * why the parameter names and the event names live here, in one module both
 * apps import, rather than as matching string literals in two repos' worth of
 * code.
 *
 * Being a `libs/shared` leaf means this module has no React, React Native, Expo
 * or Vite dependency: Metro (app) and Vite (shelter-web) both consume it.
 */

/**
 * PostHog's own bootstrap options are `distinctID` / `sessionID`; these are the
 * short, opaque URL parameters that carry them between the two apps.
 *
 * The fragment, not the query string, is where they go: a `#` parameter is
 * never sent to the server and never appears in a `Referer`.
 */
export const HANDOFF_DISTINCT_ID_PARAM = 'ba_did';
export const HANDOFF_SESSION_ID_PARAM = 'ba_sid';

export type ShelterHandoff = {
  distinctId?: string | null;
  sessionId?: string | null;
};

/**
 * Encoding is manual rather than `URLSearchParams` so that every runtime that
 * reads this — Hermes, JSC, a browser, a Node render — produces byte-identical
 * output, and a missing parameter never leaves a stray `&`.
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
 * Appends the handoff to a URL that is expected to have neither a query nor a
 * fragment. Returns the URL untouched when there is no identity to carry, so a
 * build without analytics still opens the site.
 */
export function withShelterHandoff(
  url: string,
  handoff: ShelterHandoff,
): string {
  const fragment = encodeShelterHandoff(handoff);

  return fragment ? `${url}#${fragment}` : url;
}

/**
 * Reads a `window.location.hash` value (with or without the leading `#`).
 *
 * The inverse of `encodeShelterHandoff`, and the only reader of these parameter
 * names on the web side.
 */
export function decodeShelterHandoff(hash: string): ShelterHandoff {
  const params = new URLSearchParams(hash.replace(/^#/, ''));

  return {
    distinctId: params.get(HANDOFF_DISTINCT_ID_PARAM) ?? undefined,
    sessionId: params.get(HANDOFF_SESSION_ID_PARAM) ?? undefined,
  };
}
