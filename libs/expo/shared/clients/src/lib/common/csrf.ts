import { Platform } from 'react-native';
import {
  getCookieValue,
  CSRF_COOKIE_NAME,
  CSRF_LOGIN_PATH,
} from '@monorepo/expo/shared/utils';
import { createNativeFetch } from './nativeFetch';

const getTokenFromNative = async (
  apiUrl: string,
  csrfUrl: string
): Promise<string | null> => {
  const cached = await getCookieValue(apiUrl, CSRF_COOKIE_NAME);
  if (cached) {
    return cached;
  }

  const nativeFetch = createNativeFetch(apiUrl, apiUrl);
  await nativeFetch(csrfUrl, { headers: { Accept: 'text/html' } });

  return getCookieValue(apiUrl, CSRF_COOKIE_NAME);
};

export const getCSRFToken = async (
  apiUrl: string,
  csrfUrl = `${apiUrl}${CSRF_LOGIN_PATH}`
): Promise<string | null> => {
  if (Platform.OS === 'web') {
    const getToken = () =>
      document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))?.[1] ??
      null;

    const token = getToken();
    if (token) {
      return token;
    }

    await fetch(csrfUrl, {
      credentials: 'include',
      headers: { Accept: 'text/html' },
    });
    return getToken();
  }

  return getTokenFromNative(apiUrl, csrfUrl);
};
