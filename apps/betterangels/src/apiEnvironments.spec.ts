import { describe, expect, it } from 'vitest';

import type { ApiEnvironment } from '@monorepo/ba-platform';

import { buildApiEnvironments, DEV_API_PROXY_PREFIX } from './apiEnvironments';

/**
 * These pin the rule that keeps a dev-server URL out of the native bundle.
 *
 * One Metro serves both bundles and `EXPO_PUBLIC_*` is inlined at build time, so
 * a proxy URL in the environment list is a leak: the iOS app then talks to Metro
 * instead of the API. The only combination allowed to produce a prefixed URL is
 * web + dev.
 *
 * The origin is passed in rather than read here, which is also what keeps this
 * testable: React Native defines a global `window` with no `location`, so
 * `_layout.tsx` has to read `window.location.origin` behind a `Platform.OS`
 * check — a `typeof window` guard throws on native at module load.
 */

/** The config the app passes in — direct API URLs, as native has always used. */
const DIRECT_INPUT = {
  apiUrl: 'https://api.betterangels.la',
  demoApiUrl: 'https://api.dev.betterangels.la',
};

/** The list those URLs must produce wherever the proxy does not apply. */
const DIRECT_URLS = {
  production: 'https://api.betterangels.la',
  demo: 'https://api.dev.betterangels.la',
};

const WEB_ORIGIN = 'http://localhost:8081';

const byName = (environments: ApiEnvironment[]) =>
  Object.fromEntries(environments.map(({ name, url }) => [name, url]));

describe('buildApiEnvironments', () => {
  it('web dev build: sends every environment through the same-origin dev proxy', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'web',
      isDev: true,
      webOrigin: WEB_ORIGIN,
    });

    expect(byName(environments)).toEqual({
      production: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/production`,
      demo: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/demo`,
    });
  });

  it('web dev build: normalises a trailing slash on the origin', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'web',
      isDev: true,
      webOrigin: `${WEB_ORIGIN}/`,
    });

    expect(environments.map(({ url }) => url)).toEqual([
      `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/production`,
      `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/demo`,
    ]);
  });

  it('web production export: direct URLs, no proxy — there is no dev server', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'web',
      isDev: false,
      webOrigin: WEB_ORIGIN,
    });

    expect(byName(environments)).toEqual(DIRECT_URLS);
    expect(JSON.stringify(environments)).not.toContain(DEV_API_PROXY_PREFIX);
  });

  it.each(['ios', 'android', 'macos', 'windows'])(
    'native (%s): direct URLs in a dev build too — the proxy is web-only',
    (platform) => {
      const environments = buildApiEnvironments({
        ...DIRECT_INPUT,
        platform,
        isDev: true,
        // A stale origin must not be able to make native prefixed, either.
        webOrigin: WEB_ORIGIN,
      });

      expect(byName(environments)).toEqual(DIRECT_URLS);
      expect(JSON.stringify(environments)).not.toContain(DEV_API_PROXY_PREFIX);
    },
  );

  it('native production build: direct URLs', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'ios',
      isDev: false,
    });

    expect(byName(environments)).toEqual(DIRECT_URLS);
  });

  it('web dev build with no origin (no window): falls back to the direct URLs', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'web',
      isDev: true,
    });

    expect(byName(environments)).toEqual(DIRECT_URLS);
  });

  // The proxy URL is rebuilt from the origin and the name, never appended to the
  // configured value — so a leftover `…/__api/production` in the environment
  // cannot become `…/__api/production/production`.
  it('web dev build: replaces a prefixed URL instead of double-prefixing it', () => {
    const environments = buildApiEnvironments({
      platform: 'web',
      isDev: true,
      webOrigin: WEB_ORIGIN,
      apiUrl: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/production`,
      demoApiUrl: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/demo`,
    });

    expect(environments.map(({ url }) => url)).toEqual([
      `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/production`,
      `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/demo`,
    ]);
  });

  // Native is handed the configured value verbatim — there is no rewriting to do
  // on that side, which is exactly why the variables have to hold direct URLs.
  it('native: passes the configured URLs through verbatim', () => {
    const environments = buildApiEnvironments({
      platform: 'ios',
      isDev: true,
      apiUrl: 'https://api.betterangels.la',
      demoApiUrl: 'https://api.dev.betterangels.la',
    });

    expect(environments.map(({ url }) => url)).toEqual([
      'https://api.betterangels.la',
      'https://api.dev.betterangels.la',
    ]);
  });

  it('omits the local environment when its URL is not set', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'ios',
      isDev: true,
    });

    expect(environments.map(({ name }) => name)).toEqual([
      'production',
      'demo',
    ]);
  });

  it.each([undefined, '', '   '])(
    'omits the local environment for a blank URL (%j)',
    (localApiUrl) => {
      const environments = buildApiEnvironments({
        ...DIRECT_INPUT,
        platform: 'web',
        isDev: true,
        webOrigin: WEB_ORIGIN,
        localApiUrl,
      });

      expect(environments.map(({ name }) => name)).toEqual([
        'production',
        'demo',
      ]);
    },
  );

  it('adds the local environment, proxied like the others, when it is set', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'web',
      isDev: true,
      webOrigin: WEB_ORIGIN,
      localApiUrl: 'http://localhost:8000',
    });

    expect(byName(environments)).toEqual({
      production: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/production`,
      demo: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/demo`,
      local: `${WEB_ORIGIN}${DEV_API_PROXY_PREFIX}/local`,
    });
  });

  it('uses the direct local URL on native', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'ios',
      isDev: true,
      localApiUrl: 'http://localhost:8000',
    });

    expect(byName(environments).local).toBe('http://localhost:8000');
  });

  it('keeps production first — the switcher treats the first entry as the default', () => {
    const environments = buildApiEnvironments({
      ...DIRECT_INPUT,
      platform: 'ios',
      isDev: true,
      localApiUrl: 'http://localhost:8000',
    });

    expect(environments[0]).toEqual({
      name: 'production',
      url: DIRECT_INPUT.apiUrl,
    });
  });
});
