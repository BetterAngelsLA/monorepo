/**
 * Fetch interceptor system for composable request/response handling
 */

import {
  authStorage,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
  HMIS_AUTH_COOKIE_NAME,
  HMIS_TOKEN_HEADER_NAME,
} from '@monorepo/expo/shared/utils';
import {
  HEADER_NAMES,
  HEADER_VALUES,
  MODERN_BROWSER_USER_AGENT,
  MUTATING_METHODS,
} from './constants';

export type HeadersObject = Record<string, string>;

export type FetchInterceptor = (
  input: RequestInfo | URL,
  init: RequestInit,
  next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>
) => Promise<Response>;

/**
 * Composes multiple interceptors into a single fetch function
 */
export const composeFetchInterceptors = (
  ...interceptors: FetchInterceptor[]
): ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  return (input: RequestInfo | URL, init: RequestInit = {}) => {
    // Build the chain from right to left, ending with actual fetch
    const chain = interceptors.reduceRight<
      (input: RequestInfo | URL, init: RequestInit) => Promise<Response>
    >(
      (next, interceptor) => (input, init) => interceptor(input, init, next),
      (input: RequestInfo | URL, init: RequestInit) => fetch(input, init)
    );

    return chain(input, init);
  };
};

// ============================================================================
// INTERCEPTORS
// ============================================================================

/**
 * Adds User-Agent header for browser compatibility
 */
export const userAgentInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  const headers = new Headers(init.headers);
  headers.set(HEADER_NAMES.USER_AGENT, MODERN_BROWSER_USER_AGENT);

  return next(input, { ...init, headers });
};

/**
 * Adds Referer header
 */
export const createRefererInterceptor = (referer: string): FetchInterceptor => {
  return async (input, init, next) => {
    const headers = new Headers(init.headers);
    headers.set(HEADER_NAMES.REFERER, referer);

    return next(input, { ...init, headers });
  };
};

/**
 * Adds Content-Type: application/json when there's a body
 */
export const contentTypeInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  const headers = new Headers(init.headers);

  // Only set Content-Type if there's a body and it's not already set
  if (init.body && !headers.has(HEADER_NAMES.CONTENT_TYPE)) {
    headers.set(HEADER_NAMES.CONTENT_TYPE, HEADER_VALUES.CONTENT_TYPE_JSON);
  }

  return next(input, { ...init, headers });
};

/**
 * Adds backend authentication headers (cookies, CSRF token, HMIS token)
 */
export const backendAuthInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  const { cookieHeader, csrfToken, hmisToken } =
    authStorage.getCookiesForRequest();

  const headers = new Headers(init.headers);
  if (cookieHeader) headers.set(HEADER_NAMES.COOKIE, cookieHeader);
  if (csrfToken) headers.set(CSRF_HEADER_NAME, csrfToken);
  if (hmisToken) headers.set(HMIS_TOKEN_HEADER_NAME, hmisToken);

  return next(input, { ...init, headers });
};

/**
 * Ensures CSRF token exists before mutating requests
 */
export const createCsrfInterceptor = (referer: string): FetchInterceptor => {
  return async (input, init, next) => {
    const method = (init.method || 'GET').toUpperCase();

    if (
      MUTATING_METHODS.includes(method as (typeof MUTATING_METHODS)[number])
    ) {
      const hasCsrf = !!authStorage.getCookieValue(CSRF_COOKIE_NAME);

      if (!hasCsrf) {
        const response = await fetch(`${referer}${CSRF_LOGIN_PATH}`, {
          headers: { [HEADER_NAMES.ACCEPT]: HEADER_VALUES.ACCEPT_HTML },
          credentials: 'omit',
        });
        authStorage.updateFromSetCookieHeaders(response.headers);
      }
    }

    return next(input, init);
  };
};

/**
 * Stores cookies from response Set-Cookie headers
 */
export const storeCookiesInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  const response = await next(input, init);
  authStorage.updateFromSetCookieHeaders(response.headers);
  return response;
};

/**
 * Sets credentials to 'omit' for React Native
 */
export const omitCredentialsInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  return next(input, { ...init, credentials: 'omit' });
};

// ============================================================================
// HEADER HELPERS (for direct header composition in non-fetch clients)
// ============================================================================

/**
 * Returns User-Agent header object
 */
export const getUserAgentHeaders = (): HeadersObject => ({
  [HEADER_NAMES.USER_AGENT]: MODERN_BROWSER_USER_AGENT,
});

/**
 * Returns Bearer token auth header for direct HMIS API calls
 */
export const getHmisAuthHeaders = (): HeadersObject => {
  const authToken = authStorage.getCookieValue(HMIS_AUTH_COOKIE_NAME);

  if (!authToken) {
    throw new Error('Not authenticated with HMIS');
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};
