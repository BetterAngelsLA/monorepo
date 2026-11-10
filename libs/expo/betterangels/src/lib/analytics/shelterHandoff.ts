/**
 * PostHog identity handoff from the outreach app to shelter-web.
 *
 * The app and the browser it opens are separate storage universes — an
 * in-app browser (SFSafariViewController / Chrome Custom Tabs), Safari, and
 * Chrome all start with none of the app's state. The only thing that survives
 * the jump is the URL, so the session travels in it.
 *
 * The fragment, not the query string: a `#` parameter is never sent to the
 * server and never appears in a `Referer` header, which matters because this id
 * is a person-level identifier. shelter-web reads it before PostHog boots and
 * passes it to `bootstrap`, so the landing page continues this session instead
 * of starting a new one.
 *
 * `ba_did` / `ba_sid` are deliberately short and opaque. They map to PostHog's
 * own `distinctID` / `sessionID` bootstrap options on the receiving side.
 */
export const HANDOFF_DISTINCT_ID_PARAM = 'ba_did';
export const HANDOFF_SESSION_ID_PARAM = 'ba_sid';

export type ShelterHandoff = {
  distinctId?: string | null;
  sessionId?: string | null;
};

/**
 * Encoding is manual rather than `URLSearchParams` so that every runtime this
 * app ships to — Hermes, JSC, and a Node static render — produces byte-identical
 * output, and so a missing parameter never leaves a stray `&`.
 */
export function shelterHandoffFragment(handoff: ShelterHandoff): string {
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
 * fragment — `shelterHomeUrl` clears both. Returns the URL untouched when there
 * is no identity to carry, so a build without analytics still opens the site.
 */
export function withShelterHandoff(
  url: string,
  handoff: ShelterHandoff,
): string {
  const fragment = shelterHandoffFragment(handoff);

  return fragment ? `${url}#${fragment}` : url;
}
