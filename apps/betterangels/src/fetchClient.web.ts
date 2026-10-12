// ---------------------------------------------------------------------------
// The web fetch client — see `fetchClient.ts` for why this is a platform pair.
//
// `createWebFetchClient()` owns CSRF (read from `document.cookie`, refreshed via
// the Django admin login path) and `credentials: 'include'`.
//
// No native interceptors here: the HMIS pair reads the native cookie jar, and
// browsers strip `Referer` and `User-Agent` as forbidden headers.
// ---------------------------------------------------------------------------
import { createWebFetchClient } from '@monorepo/ba-platform/web';
import { configurePlacesProxy } from '@monorepo/shared/places';

/** `apiUrl` selects both the request target and the Places proxy origin. */
export const buildFetchClient = (apiUrl: string) => {
  const fetchClient = createWebFetchClient(apiUrl);

  // Places/geocoding go through the BA backend proxy on web: the native keys are
  // restricted by bundle id / signing certificate, which a browser cannot satisfy.
  // Routing through the app's fetch client carries the session cookie and CSRF
  // header the proxy's `@login_required` needs. Re-installed per environment
  // switch, since the origin changes.
  configurePlacesProxy({ apiUrl, fetch: fetchClient });

  return fetchClient;
};
