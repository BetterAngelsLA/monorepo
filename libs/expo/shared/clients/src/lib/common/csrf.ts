import { CSRF_COOKIE_NAME, CSRF_LOGIN_PATH } from '@monorepo/expo/shared/utils';
import { createNativeFetch } from './nativeFetch';
import CookieManager from '@preeternal/react-native-cookie-manager';

const extractCookieValue = (cookieName: string): string | null => {
  const match = document.cookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match?.[1] ?? null;
};

const getTokenFromNative = async (
  apiUrl: string,
  csrfUrl: string
): Promise<string | null> => {
  // Check if we already have a CSRF token
  const cookies = await CookieManager.get(apiUrl);
  const cached = cookies[CSRF_COOKIE_NAME]?.value;
  if (cached) {
    return cached;
  }

  // Fetch CSRF token from server
  const nativeFetch = createNativeFetch(apiUrl);
  await nativeFetch(csrfUrl, { headers: { Accept: 'text/html' } });

  // Get the newly set token
  const newCookies = await CookieManager.get(apiUrl);
  return newCookies[CSRF_COOKIE_NAME]?.value ?? null;
};

export const getCSRFToken = async (
  apiUrl: string,
  csrfUrl = `${apiUrl}${CSRF_LOGIN_PATH}`
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    const token = extractCookieValue(CSRF_COOKIE_NAME);
    if (token) {
      return token;
    }

    await fetch(csrfUrl, {
      credentials: 'include',
      headers: { Accept: 'text/html' },
    });
    return extractCookieValue(CSRF_COOKIE_NAME);
  }

  return getTokenFromNative(apiUrl, csrfUrl);
};
