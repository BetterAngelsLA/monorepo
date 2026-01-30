/**
 * Fetch interceptor system for composable request/response handling
 */

import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
  HMIS_AUTH_COOKIE_NAME,
  HMIS_TOKEN_HEADER_NAME,
  HMIS_API_URL_STORAGE_KEY,
} from '@monorepo/expo/shared/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NitroCookies from 'react-native-nitro-cookies';
import {
  HEADER_NAMES,
  HEADER_VALUES,
  MODERN_BROWSER_USER_AGENT,
  MUTATING_METHODS,
} from './constants';
import { getSessionManager } from './sessionManager';

export type HeadersObject = Record<string, string>;

export type FetchInterceptor = (
  input: RequestInfo | URL,
  init: RequestInit,
  next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>
) => Promise<Response>;

/**
 * Helper to extract URL string from RequestInfo
 */
const getUrl = (input: RequestInfo | URL): string =>
  typeof input === 'string'
    ? input
    : input instanceof URL
    ? input.href
    : input.url;

/**
 * Helper to get HMIS auth token from the stored HMIS domain
 */
const getHmisAuthToken = async (): Promise<string | null> => {
  try {
    const hmisApiUrl = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);
    if (!hmisApiUrl) return null;

    const hmisCookies = await NitroCookies.get(hmisApiUrl);
    return hmisCookies[HMIS_AUTH_COOKIE_NAME]?.value || null;
  } catch (error) {
    return null;
  }
};

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
 * Body handling interceptor - serializes objects to JSON and sets Content-Type
 */
export const bodyInterceptor: FetchInterceptor = async (input, init, next) => {
  const headers = new Headers(init.headers);
  let body = init.body;

  // Serialize non-string, non-FormData bodies to JSON
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  // Set Content-Type header if there's a body and it's not already set
  if (body && !headers.has(HEADER_NAMES.CONTENT_TYPE)) {
    headers.set(HEADER_NAMES.CONTENT_TYPE, HEADER_VALUES.CONTENT_TYPE_JSON);
  }

  return next(input, { ...init, headers, body });
};

/**
 * Adds backend authentication headers (CSRF token, HMIS token)
 * Cookies are automatically handled by nitro-cookies
 */
export const backendAuthInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  const headers = new Headers(init.headers);
  const url = getUrl(input);

  // Add CSRF token header
  const cookiesForUrl = await NitroCookies.get(url);
  const csrfCookie = cookiesForUrl[CSRF_COOKIE_NAME];
  if (csrfCookie?.value) {
    headers.set(CSRF_HEADER_NAME, csrfCookie.value);
  }

  // Add HMIS token header (retrieved from stored HMIS domain)
  const hmisToken = await getHmisAuthToken();
  if (hmisToken) {
    headers.set(HMIS_TOKEN_HEADER_NAME, hmisToken);
  }

  return next(input, { ...init, headers });
};

/**
 * Helper to fetch fresh CSRF token from Django
 */
const fetchFreshCsrf = async (referer: string): Promise<void> => {
  const csrfResponse = await fetch(
    `${referer}${CSRF_LOGIN_PATH}?t=${Date.now()}`,
    {
      headers: {
        [HEADER_NAMES.ACCEPT]: HEADER_VALUES.ACCEPT_HTML,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      credentials: 'include',
      cache: 'no-store',
    }
  );

  const setCookie = csrfResponse.headers.get('set-cookie');
  if (setCookie) {
    await NitroCookies.setFromResponse(referer, setCookie);
  }
};

/**
 * CSRF interceptor that handles Django CSRF protection
 * Uses retry strategy: attempt request, if 403 fetch CSRF and retry once
 */
export const createCsrfInterceptor = (referer: string): FetchInterceptor => {
  return async (input, init, next) => {
    let response = await next(input, init);

    if (response.status === 403) {
      const method = (init.method || 'GET').toUpperCase();
      const isMutating = MUTATING_METHODS.includes(
        method as (typeof MUTATING_METHODS)[number]
      );

      if (isMutating) {
        await fetchFreshCsrf(referer);
        response = await next(input, init);
      }
    }

    return response;
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
  const url = getUrl(input);

  const response = await next(input, init);
  const setCookie = response.headers.get('set-cookie');

  if (setCookie) {
    await NitroCookies.setFromResponse(url, setCookie);
  }

  return response;
};

/**
 * Monitors session cookie expiry after each request.
 * Checks after response received - when cookies may have been updated via Set-Cookie.
 * NitroCookies.get() is fast (synchronous, in-memory) so minimal overhead.
 */
export const sessionExpiryInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  const response = await next(input, init);
  
  // Check session expiry after storing cookies
  // Backend URL is set by SessionManagerProvider from React context
  const manager = getSessionManager();
  if (manager) {
    await manager.checkAndSchedule();
  }
  return response;
};

/**
 * HMIS-specific interceptor for direct HMIS API calls
 * Request phase: Adds Bearer token auth and HMIS-required headers
 * Response phase: Extracts and stores api_url from Set-Cookie
 */
export const hmisInterceptor: FetchInterceptor = async (input, init, next) => {
  const headers = new Headers(init.headers);

  // Request phase: Add HMIS headers
  const hmisApiUrl = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);
  if (hmisApiUrl) {
    const cookies = await NitroCookies.get(hmisApiUrl);
    const authToken = cookies[HMIS_AUTH_COOKIE_NAME]?.value;

    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
  }

  // Add HMIS-required headers
  headers.set(HEADER_NAMES.ACCEPT, HEADER_VALUES.ACCEPT_JSON_ALL);
  headers.set(
    HEADER_NAMES.X_REQUESTED_WITH,
    HEADER_VALUES.X_REQUESTED_WITH_AJAX
  );

  // Make request
  const response = await next(input, { ...init, headers });

  // Response phase: Extract and store api_url
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const apiUrlMatch = setCookie.match(/api_url=([^;]+)/);
    if (apiUrlMatch) {
      const decodedUrl = decodeURIComponent(apiUrlMatch[1]);
      await AsyncStorage.setItem(HMIS_API_URL_STORAGE_KEY, decodedUrl);
    }
  }

  return response;
};

/**
 * Sets credentials: 'include' to enable cookie handling
 */
export const includeCredentialsInterceptor: FetchInterceptor = async (
  input,
  init,
  next
) => {
  return next(input, { ...init, credentials: 'include' });
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
 * Gets HMIS-specific authentication headers for direct HMIS API calls
 * Uses Bearer token format for direct HMIS REST API communication
 * Note: This is different from backend GraphQL requests which use X-HMIS-Token header
 */
export const getHmisAuthHeaders = async (
  hmisApiUrl: string
): Promise<HeadersObject> => {
  const cookies = await NitroCookies.get(hmisApiUrl);
  const authToken = cookies['auth_token']?.value;

  if (authToken) {
    return {
      Authorization: `Bearer ${authToken}`,
    };
  }

  return {};
};
