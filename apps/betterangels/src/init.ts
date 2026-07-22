// ---------------------------------------------------------------------------
// App bootstrap — side effects, singletons, and config factories.
// Imported once by _layout.tsx.  Metro re-evaluates this module on hot
// reload, so singletons are safely refreshed during development.
// ---------------------------------------------------------------------------
import { QueryClient } from '@tanstack/react-query';

import { initApolloRuntimeConfig } from '@monorepo/apollo';
import { createExpoFetchClient } from '@monorepo/ba-platform/expo';
import { createBaTypePolicies } from '@monorepo/expo/betterangels';
import {
  createRefererInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
  userAgentInterceptor,
} from '@monorepo/expo/shared/clients';
import { hideDevMenuFab } from '@monorepo/expo/shared/utils';

// ---- Compile-time constants ----
export const isDevEnv = process.env['NODE_ENV'] === 'development';

export const isGqlDebug =
  process.env['EXPO_PUBLIC_GQL_DEBUG'] === 'true' &&
  process.env['NODE_ENV'] !== 'production';

// ---- One-time side effects ----

// Hide the expo-dev-menu floating "Tools" FAB on iOS dev clients
// (overlaps `nav-menu-btn`). No-op in production / store builds and on
// Android. See helper for details.
// TODO: Remove once on SDK 56+ — expo-dev-launcher gains a build-time
// plugin option to hide the FAB on both platforms (PR expo/expo#44251).
hideDevMenuFab();
initApolloRuntimeConfig({ isDevEnv: false });

// ---- Singletons (stable references across re-renders) ----
export const baTypePolicies = createBaTypePolicies(isDevEnv);

export const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false }, // need custom implementation for React Native
  },
});

// ---- Interceptor factory (consumed by EnvironmentSwitcherProvider) ----
export const buildFetchClient = (apiUrl: string) =>
  createExpoFetchClient(apiUrl, [
    createRefererInterceptor(apiUrl),
    userAgentInterceptor,
    hmisAuthInterceptor,
    interceptorHmis,
  ]);
