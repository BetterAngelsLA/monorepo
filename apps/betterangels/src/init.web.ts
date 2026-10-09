// ---------------------------------------------------------------------------
// Web app bootstrap — the react-native-web counterpart of `init.ts`.
//
// This is a separate module rather than a runtime branch because the two
// platform adapters (`@monorepo/ba-platform/expo` and `@monorepo/ba-platform/web`)
// must never end up in the same bundle; the NX scope constraints exist to
// enforce that. Metro picks this file over `init.ts` when bundling for web.
//
// Keep the exported surface identical to `init.ts`.
// ---------------------------------------------------------------------------
import { QueryClient } from '@tanstack/react-query';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { createWebFetchClient } from '@monorepo/ba-platform/web';
import { createBaTypePolicies } from '@monorepo/expo/betterangels';
import { configurePlacesProxy } from '@monorepo/shared/places';

// ---- Compile-time constants ----
export const isDevEnv = process.env['NODE_ENV'] === 'development';

// ---- One-time side effects ----

initApolloRuntimeConfig({ isDevEnv: false });

// ---- Singletons (stable references across re-renders) ----
export const baTypePolicies = createBaTypePolicies(isDevEnv);

export const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false }, // need custom implementation for React Native
  },
});

// ---- Interceptor factory (consumed by EnvironmentSwitcherProvider) ----
//
// `createWebFetchClient()` owns CSRF (read from `document.cookie`, refreshed via
// the Django admin login path) and `credentials: 'include'` on its own.
//
// The native client's extra interceptors are deliberately absent here:
//   - `hmisAuthInterceptor` / `interceptorHmis` read the native cookie jar. HMIS
//     is not supported on web yet — see docs/outreach-web.md.
//   - `createRefererInterceptor` and `userAgentInterceptor` set `Referer` and
//     `User-Agent`, which browsers strip as forbidden headers.
//
// `apiUrl` selects both the request target and the Places proxy origin.
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
