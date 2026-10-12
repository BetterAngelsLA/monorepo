// ---------------------------------------------------------------------------
// The native fetch client — a platform pair with `fetchClient.web.ts`.
//
// A pair rather than a `Platform.OS` branch, because the two adapters must never
// share a bundle: an ES import is evaluated whether or not a branch uses it.
//
// Both files must export the same surface; `init.ts` re-exports through this
// path, so a missing export is a web-only runtime error.
// ---------------------------------------------------------------------------
import { createExpoFetchClient } from '@monorepo/ba-platform/expo';
import {
  createRefererInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
  userAgentInterceptor,
} from '@monorepo/expo/shared/clients';
import { hideDevMenuFab } from '@monorepo/expo/shared/utils';

// Native-only startup work lives here, not in `init.ts`, so the web bundle never
// pulls it in. The helper is a no-op off iOS and outside dev/E2E builds.
// TODO: Remove once on SDK 56+ — expo-dev-launcher gains a build-time plugin
// option to hide the FAB on both platforms (PR expo/expo#44251).
hideDevMenuFab();

/** `apiUrl` is both the request target and the referer the backend expects. */
export const buildFetchClient = (apiUrl: string) =>
  createExpoFetchClient(apiUrl, [
    createRefererInterceptor(apiUrl),
    userAgentInterceptor,
    hmisAuthInterceptor,
    interceptorHmis,
  ]);
