import CookieManager from '@preeternal/react-native-cookie-manager';
import type { TokenReader, TokenRefresher } from '@monorepo/ba-platform';

/**
 * React Native ``TokenReader`` — reads a cookie value via ``CookieManager``.
 *
 * On React Native there is no global ``document.cookie``; cookies are
 * scoped per-URL.  The returned reader queries cookies for ``baseUrl``.
 */
export const createNativeTokenReader = (baseUrl: string): TokenReader =>
  async (name: string) => {
    try {
      const cookies = await CookieManager.get(baseUrl);
      return cookies[name]?.value ?? null;
    } catch {
      return null;
    }
  };

/**
 * React Native ``TokenRefresher`` — fetches a fresh CSRF token and
 * persists the ``Set-Cookie`` response via ``CookieManager``.
 *
 * On web the browser handles ``Set-Cookie`` automatically; on React
 * Native the cookie manager must be told explicitly.
 */
export const createNativeTokenRefresher = (baseUrl: string): TokenRefresher =>
  async (loginPath: string) => {
    const url = `${baseUrl}${loginPath}?t=${Date.now()}`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      try {
        await CookieManager.setFromResponse(baseUrl, setCookie);
      } catch {
        // Non-critical — the next request will get a 403 and the
        // reactive CSRF retry interceptor will handle recovery.
      }
    }
  };
