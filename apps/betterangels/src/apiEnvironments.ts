// ---------------------------------------------------------------------------
// The API environments the switcher offers, and which URL each one uses.
//
// `EXPO_PUBLIC_*` values are inlined per bundle, and one Metro serves both the
// web and the native bundles — so a dev-server URL in `EXPO_PUBLIC_API_URL` is
// baked into the iOS/Android bundle too, and the native app ends up talking to
// Metro instead of the API. Those variables therefore stay **direct API URLs**,
// and only the web dev bundle rewrites them to the same-origin dev proxy.
//
// Kept pure — no `Platform` or `window` reads — so the rule can be unit-tested
// without a browser; `_layout.tsx` supplies the platform facts.
// ---------------------------------------------------------------------------
import type { ApiEnvironment } from '@monorepo/ba-platform';

/** Where the dev server mounts the proxy (see dev-api-proxy.js). */
export const DEV_API_PROXY_PREFIX = '/__api';

export interface BuildApiEnvironmentsOptions {
  /** `Platform.OS` — only the browser cannot reach the API directly; native is unaffected. */
  platform: string;
  /** `__DEV__` — a production web export has no dev server in front of it. */
  isDev: boolean;
  /**
   * `window.location.origin` — the dev server serving the page also proxies it.
   *
   * Read it behind a `Platform.OS === 'web'` check, **not** `typeof window`:
   * React Native defines a global `window` with no `location`, so the `typeof`
   * guard passes on native and the dereference throws at module load.
   */
  webOrigin?: string;
  /** `EXPO_PUBLIC_API_URL` — the production environment. */
  apiUrl: string;
  /** `EXPO_PUBLIC_DEMO_API_URL` — the demo environment. */
  demoApiUrl: string;
  /** `EXPO_PUBLIC_LOCAL_API_URL` — optional; adds a `local` environment when set. */
  localApiUrl?: string;
}

/**
 * The environment list handed to `EnvironmentSwitcherProvider`.
 *
 * On a **web dev build** each URL is the dev proxy's own target path
 * (`<origin>/__api/<environment>`) — the browser cannot call a deployed API
 * directly (CORS, and a `csrftoken` cookie scoped to the API's domain), while a
 * dev server on the page's origin can. Everywhere else — native, and any
 * production web export — the direct API URL is used, which is what keeps a
 * dev-server URL out of the iOS/Android bundle.
 *
 * The names must match the proxy's targets, which are derived from the same
 * variables (see `apps/betterangels/dev-api-proxy.js`).
 */
export function buildApiEnvironments({
  platform,
  isDev,
  webOrigin,
  apiUrl,
  demoApiUrl,
  localApiUrl,
}: BuildApiEnvironmentsOptions): ApiEnvironment[] {
  // Both conditions are load-bearing and both are checked here, in one place:
  // `platform` keeps the prefix out of the native bundle, and `isDev` keeps it
  // out of a deployed web bundle. `webOrigin` is absent outside a browser, which
  // falls back to the direct URLs.
  const proxyBase =
    platform === 'web' && isDev && webOrigin
      ? `${webOrigin.replace(/\/+$/, '')}${DEV_API_PROXY_PREFIX}`
      : null;

  const environmentUrl = (name: string, directUrl: string) =>
    proxyBase ? `${proxyBase}/${name}` : directUrl;

  const environments: ApiEnvironment[] = [
    { name: 'production', url: environmentUrl('production', apiUrl) },
    { name: 'demo', url: environmentUrl('demo', demoApiUrl) },
  ];

  // Only when configured: a deployed build has no local backend, and offering an
  // unreachable environment is worse than not offering it.
  const local = localApiUrl?.trim();
  if (local) {
    environments.push({ name: 'local', url: environmentUrl('local', local) });
  }

  return environments;
}
