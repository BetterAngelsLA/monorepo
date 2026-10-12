// ---------------------------------------------------------------------------
// App bootstrap — side effects, singletons, and config factories.
// Imported once by _layout.tsx.  Metro re-evaluates this module on hot
// reload, so singletons are safely refreshed during development.
//
// Everything here is common to both platforms. The one part that is not — the
// fetch client, where the native and web adapters must not meet — lives in the
// platform pair `./fetchClient`, which is re-exported below so importers still
// get `buildFetchClient` from this one module.
// ---------------------------------------------------------------------------
import { QueryClient } from '@tanstack/react-query';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { createBaTypePolicies } from '@monorepo/expo/betterangels';

export { buildFetchClient } from './fetchClient';

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
