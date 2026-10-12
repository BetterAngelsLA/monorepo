// ---------------------------------------------------------------------------
// The native fetch client — the app's request pipeline, as a platform pair with
// `fetchClient.web.ts`.
//
// A platform pair rather than a `Platform.OS` branch in `init.ts`, because the
// two adapters (`@monorepo/ba-platform/expo` and `@monorepo/ba-platform/web`)
// must never end up in the same bundle: an ES import is evaluated whether or not
// a branch uses it, so a runtime check cannot keep the native adapter — and the
// native modules behind it — out of the web bundle. Metro resolves the `.web`
// file when bundling for web. The NX scope constraints exist to enforce the same
// separation.
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

// Native-only startup work belongs in this file, not in `init.ts`, so the web
// bundle never pulls it in.
//
// Hide the expo-dev-menu floating "Tools" FAB on iOS dev clients (it overlaps
// `nav-menu-btn`). No-op in production / store builds and on Android — see the
// helper for the gating.
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
