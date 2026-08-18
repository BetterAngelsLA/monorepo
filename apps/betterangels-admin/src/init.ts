// ---------------------------------------------------------------------------
// App bootstrap — side effects, singletons, and config factories.
// Imported once by main.tsx, whose module body cannot run until this one has
// finished: that is what guarantees the active-org store is installed before
// any fetch client exists.
// ---------------------------------------------------------------------------
import { HttpLink } from '@apollo/client';

import { configureActiveOrgStorage, getGraphqlUrl } from '@monorepo/ba-platform';
import {
  createWebFetchClient,
  webActiveOrgStorage,
} from '@monorepo/ba-platform/web';

import { apiUrl } from '../config';

// ---- Compile-time constants ----
export const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

// ---- One-time side effects ----

// Before anything can issue a request — the interceptor reads this.
configureActiveOrgStorage(webActiveOrgStorage);

// ---- Singletons (stable references across re-renders) ----

// createWebFetchClient() is URL-agnostic — CSRF cookies are origin-scoped and
// the token lives on the same domain as the API.  The buildFetch factory
// signature exists for the Expo env-switching case; web ignores the apiUrl
// parameter.
export const fetchClient = createWebFetchClient();

export const apolloLink = new HttpLink({
  uri: getGraphqlUrl(apiUrl),
  fetch: fetchClient,
});
