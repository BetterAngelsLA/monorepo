// ---------------------------------------------------------------------------
// The web fetch client — see `fetchClient.ts` for why this is a platform pair
// and why the native adapter cannot be reached from here.
//
// `createWebFetchClient()` owns CSRF (read from `document.cookie`, refreshed via
// the Django admin login path) and `credentials: 'include'` on its own.
//
// The native client's extra interceptors are deliberately absent:
//   - `hmisAuthInterceptor` / `interceptorHmis` read the native cookie jar, and
//     HMIS is not supported on web yet.
//   - `createRefererInterceptor` and `userAgentInterceptor` set `Referer` and
//     `User-Agent`, which browsers strip as forbidden headers.
// ---------------------------------------------------------------------------
import { createWebFetchClient } from '@monorepo/ba-platform/web';
import { configurePlacesProxy } from '@monorepo/shared/places';

/** `apiUrl` selects both the request target and the Places proxy origin. */
export const buildFetchClient = (apiUrl: string) => {
  const fetchClient = createWebFetchClient();

  // Places/geocoding go through the BA backend proxy on web. The native Google
  // keys are restricted by bundle id / package name + signing certificate, and
  // the headers that satisfy that cannot be set from a browser. The proxy holds
  // its own key server-side; routing through the app's fetch client means the
  // call carries the session cookie and CSRF header its `@login_required` needs.
  // Re-installed on every environment switch, since the origin changes.
  configurePlacesProxy({ apiUrl, fetch: fetchClient });

  return fetchClient;
};
