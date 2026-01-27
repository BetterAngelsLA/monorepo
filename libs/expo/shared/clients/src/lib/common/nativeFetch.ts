import { Platform } from 'react-native';
import { authStorage } from '@monorepo/expo/shared/utils';
import { CSRF_HEADER_NAME } from './constants';

export const createNativeFetch = (envKey: string, referer: string) => {
  if (Platform.OS === 'web') {
    throw new Error('createNativeFetch is for React Native platforms only');
  }

  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers ?? {});

    if (!headers.has('Cookie')) {
      const { cookieHeader, csrfToken } =
        authStorage.getCookiesForRequest(envKey);
      if (cookieHeader) headers.set('Cookie', cookieHeader);
      if (csrfToken && !headers.has(CSRF_HEADER_NAME)) {
        headers.set(CSRF_HEADER_NAME, csrfToken);
      }
    }

    if (!headers.has('Referer')) {
      headers.set('Referer', referer);
    }

    const response = await fetch(input as any, {
      ...init,
      headers,
      credentials: 'omit',
    });

    authStorage.updateFromSetCookieHeaders(envKey, response.headers as any);

    return response;
  };
};
