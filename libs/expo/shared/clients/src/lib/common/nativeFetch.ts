import { Platform } from 'react-native';
import {
  backendAuthInterceptor,
  contentTypeInterceptor,
  ensureCsrfToken,
  logAuthFailureInterceptor,
  refererInterceptor,
  storeCookiesInterceptor,
  userAgentInterceptor,
} from './interceptors';

/**
 * Creates a fetch wrapper for React Native with backend authentication
 */
export const createNativeFetch = (referer: string) => {
  if (Platform.OS === 'web') {
    throw new Error('createNativeFetch is for React Native platforms only');
  }

  return async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : input.url;
    const method = (init.method || 'GET').toUpperCase();

    // Ensure CSRF token exists for mutating requests
    await ensureCsrfToken(referer, method);

    // Compose headers from interceptors + user headers
    const headers = new Headers({
      ...userAgentInterceptor(),
      ...contentTypeInterceptor(!!init.body),
      ...refererInterceptor(referer),
      ...backendAuthInterceptor(),
      ...init.headers, // User headers override defaults
    });

    const response = await fetch(input as any, {
      ...init,
      headers,
      credentials: 'omit',
    });

    storeCookiesInterceptor(response);
    logAuthFailureInterceptor(url, response.status);

    return response;
  };
};
