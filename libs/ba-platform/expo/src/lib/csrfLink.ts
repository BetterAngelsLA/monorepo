import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@monorepo/ba-platform';
import { createCsrfLink, type CsrfTokenProvider } from '@monorepo/ba-platform';
import { createNativeFetch } from '@monorepo/expo/shared/clients';
import CookieManager from '@preeternal/react-native-cookie-manager';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Expo token provider (CookieManager + Platform.OS web fallback)
// ---------------------------------------------------------------------------

const webReadToken = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ?? null;
};

const nativeReadToken = async (
  apiUrl: string,
  name: string
): Promise<string | null> => {
  const cookies = await CookieManager.get(apiUrl);
  return cookies[name]?.value ?? null;
};

const refreshNativeToken = async (
  apiUrl: string,
  loginPath: string
): Promise<void> => {
  const nativeFetch = createNativeFetch(apiUrl);
  await nativeFetch(`${apiUrl}${loginPath}`, {
    headers: { Accept: 'text/html' },
  });
};

const expoTokenProvider: CsrfTokenProvider = {
  getToken: async (cookieName: string) => {
    if (Platform.OS === 'web') {
      const token = webReadToken(cookieName);
      if (token) return token;

      await fetch(CSRF_LOGIN_PATH, {
        credentials: 'include',
        headers: { Accept: 'text/html' },
      });
      return webReadToken(cookieName);
    }

    // Native: read from CookieManager, refresh if missing
    const apiUrl = ''; // Not used by the link — token provider gets called per-operation
    let token = await nativeReadToken(apiUrl, cookieName);
    if (!token) {
      await refreshNativeToken(apiUrl, CSRF_LOGIN_PATH);
      token = await nativeReadToken(apiUrl, cookieName);
    }
    return token;
  },
};

// ---------------------------------------------------------------------------
// Convenience instance
// ---------------------------------------------------------------------------

/** Pre-configured CSRF link for Expo / React Native apps. */
export const expoCsrfLink = createCsrfLink(expoTokenProvider, {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
});

// -- Standalone token helper (outside Apollo chain) ------------------------

/**
 * Read the CSRF token from cookies (``CookieManager`` on native,
 * ``document.cookie`` on web), refreshing from ``/admin/login/`` if
 * missing. Used by ``ApiConfigProvider`` outside the Apollo link chain.
 */
export const getCsrfToken = async (
  apiUrl: string,
  csrfUrl = `${apiUrl}/admin/login/`
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    let token = webReadToken(CSRF_COOKIE_NAME);
    if (!token) {
      await fetch(csrfUrl, {
        credentials: 'include',
        headers: { Accept: 'text/html' },
      });
      token = webReadToken(CSRF_COOKIE_NAME);
    }
    return token;
  }

  let token = await nativeReadToken(apiUrl, CSRF_COOKIE_NAME);
  if (!token) {
    await refreshNativeToken(apiUrl, '/admin/login/');
    token = await nativeReadToken(apiUrl, CSRF_COOKIE_NAME);
  }
  return token;
};
