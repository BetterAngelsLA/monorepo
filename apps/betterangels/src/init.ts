// ---------------------------------------------------------------------------
// App bootstrap — side effects, singletons, and config factories.
// Imported once by _layout.tsx.  Metro re-evaluates this module on hot
// reload, so singletons are safely refreshed during development.
//
// Everything here is common to both platforms; platform-divergent pieces sit
// behind platform pairs. The fetch client, where the native and web adapters must
// not meet, lives in `./fetchClient` — re-exported below so importers still get
// `buildFetchClient` from this one module.
// ---------------------------------------------------------------------------
import { QueryClient } from '@tanstack/react-query';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { createBaTypePolicies } from '@monorepo/expo/betterangels';
import { configureWebMaps } from '@monorepo/expo/shared/ui-components';

import { googlePlacesApiKey } from '../config';

export { buildFetchClient } from './fetchClient';

// ---- Compile-time constants ----
export const isDevEnv = process.env['NODE_ENV'] === 'development';

// ---- One-time side effects ----
initApolloRuntimeConfig({ isDevEnv: false });

// The browser's Maps JavaScript API takes its key as a prop on the map itself,
// while the native SDKs read theirs from the app.config.js plugins. Hand it to
// the web maps seam here, ahead of any render; no-op on native.
configureWebMaps({ apiKey: googlePlacesApiKey });

// ---- Singletons (stable references across re-renders) ----
export const baTypePolicies = createBaTypePolicies(isDevEnv);

export const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false }, // need custom implementation for React Native
  },
});
