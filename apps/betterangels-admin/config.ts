const configuredApiUrl = import.meta.env.VITE_BETTERANGELS_ADMIN_API_URL;

/**
 * In local development, point the API at whichever hostname the page is being
 * browsed on.
 *
 * The session cookie is host-only — the API sends `Set-Cookie: sessionid=…` with
 * no `Domain` attribute — so a page on `localhost` calling an API on `127.0.0.1`
 * is a different site: the login POST returns 403 "CSRF cookie not set" and no
 * cookie is ever stored. Those two names are the same machine, so configuring one
 * and browsing the other fails for no reason a developer can see.
 *
 * Rewriting at runtime rather than asking everyone to keep `.env` in sync with
 * their address bar means `localhost:8084`, `127.0.0.1:8084` and a LAN address all
 * work from one configuration. Only the host comes from the page; scheme and port
 * come from the configured URL, so a dev server on a non-default port still points
 * at the right API.
 *
 * Development only. In preview and production the configured URL is authoritative —
 * the API is a different origin and nothing here should second-guess it.
 */
function resolveApiUrl(configured: string): string {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return configured;
  }

  try {
    const api = new URL(configured);
    const isLocalApi =
      api.hostname === 'localhost' || api.hostname === '127.0.0.1';

    if (!isLocalApi) {
      return configured;
    }
    // A page served over https must not call a plain-http API; leave it alone
    // rather than emit a URL the browser blocks as mixed content.
    if (window.location.protocol === 'https:' && api.protocol !== 'https:') {
      return configured;
    }
    api.hostname = window.location.hostname;
    return api.origin;
  } catch {
    // Not an absolute URL (a relative base is a legitimate configuration).
    return configured;
  }
}

const apiUrl = resolveApiUrl(configuredApiUrl ?? '');

/**
 * Google Maps key for the region map on the Reports page.
 *
 * Its own key, not shelter-web's: a Maps key carries HTTP-referrer restrictions and a quota,
 * and the two apps are served from different origins — so one key cannot be correctly
 * referrer-restricted for both, and a busy admin report would spend shelter-web's quota.
 *
 * Deliberately not `throw`n when absent, unlike `apiUrl` above: the rest of the admin app works
 * without a map, so a missing key should degrade the one panel rather than take down the page.
 * `RegionMap` checks for this and says so.
 */
const googleMapsApiKey =
  import.meta.env.VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY ?? '';

export { apiUrl, googleMapsApiKey };
