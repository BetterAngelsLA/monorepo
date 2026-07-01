/**
 * Fetch interceptor system for composable request/response handling
 */

import type { FetchInterceptor } from '@monorepo/apollo';
import { composeFetchInterceptors } from '@monorepo/apollo';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
  HMIS_AUTH_COOKIE_NAME,
  HMIS_TOKEN_HEADER_NAME,
} from '@monorepo/expo/shared/utils';
import CookieManager from '@preeternal/react-native-cookie-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parse as parseCookies, splitCookiesString } from 'set-cookie-parser';
import {
  HEADER_NAMES,
  HEADER_VALUES,
  MODERN_BROWSER_USER_AGENT,
  MUTATING_METHODS,
} from './constants';

export type HeadersObject = Record<string, string>;

export const HMIS_API_URL_STORAGE_KEY = 'hmis_api_url';
export const HMIS_AUTH_DOMAIN_STORAGE_KEY = 'hmis_auth_domain';

/**
 * Detect FormData-like objects via `append` method.
 * Avoids unreliable `instanceof FormData` checks in React Native.
 */
type FormDataLike = {
  append: (...args: unknown[]) => unknown;
};

function isFormDataLike(value: unknown): value is FormDataLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'append' in value &&
    typeof (value as FormDataLike).append === 'function'
  );
}

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
const getAuthTokenHmis = async (): Promise<string | null> => {
  try {
    const targetUrl = await AsyncStorage.getItem(HMIS_AUTH_DOMAIN_STORAGE_KEY);

    if (!targetUrl) return null;

    const cookiesHmis = await CookieManager.get(targetUrl);
    return cookiesHmis[HMIS_AUTH_COOKIE_NAME]?.value || null;
  } catch (error) {
    return null;
  }
};

/**
 * Helper to get authentication and valid headers for HMIS requests (e.g. for Images)
 */
export const getAuthHeadersHmis = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    [HEADER_NAMES.ACCEPT]: HEADER_VALUES.ACCEPT_JSON_ALL,
    [HEADER_NAMES.X_REQUESTED_WITH]: HEADER_VALUES.X_REQUESTED_WITH_AJAX,
  };

  const token = await getAuthTokenHmis();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export interface FileHeadersLoadResultHmis {
  headers: Record<string, string> | null;
  baseUrl: string | null;
}

/**
 * Load HMIS file request config (base URL + auth headers) from storage.
 * Used by useFileHeadersHmis (React Query) to load and cache config.
 */
export const loadFileHeadersHmis =
  async (): Promise<FileHeadersLoadResultHmis> => {
    try {
      const url = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);
      if (!url) return { headers: null, baseUrl: null };
      const authHeaders = await getAuthHeadersHmis();
      return { headers: authHeaders, baseUrl: url };
    } catch (error) {
      console.error('Failed to load HMIS headers', error);
      return { headers: null, baseUrl: null };
    }
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
 * Adds Referer header.  When ``referer`` is omitted the header is not sent
 * (the browser / runtime default applies).
 */
export const createRefererInterceptor = (referer?: string): FetchInterceptor => {
  return async (input, init, next) => {
    if (referer === undefined) return next(input, init);
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

  const isFormData = isFormDataLike(body);

  if (body && !isFormData && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  // Set Content-Type header if there's a body and it's not already set.
  // For FormData, let fetch set the header (it adds the multipart boundary).
  if (body && !isFormData && !headers.has(HEADER_NAMES.CONTENT_TYPE)) {
    headers.set(HEADER_NAMES.CONTENT_TYPE, HEADER_VALUES.CONTENT_TYPE_JSON);
  }

  return next(input, { ...init, headers, body });
};

/**
 * Injects the HMIS token header for authenticated HMIS API requests.
 *
 * CSRF header injection is handled separately by the ba-platform
 * ``createCsrfInterceptor`` (proactive) and the reactive retry below.
 */
export const hmisAuthInterceptor: FetchInterceptor = async (
  _input,
  init,
  next
) => {
  const tokenHmis = await getAuthTokenHmis();
  if (!tokenHmis) return next(_input, init);

  const headers = new Headers(init.headers);
  headers.set(HMIS_TOKEN_HEADER_NAME, tokenHmis);
  return next(_input, { ...init, headers });
};

/**
 * Fetch a fresh CSRF token from the Django admin login endpoint.
 *
 * @param baseUrl  Base URL of the Django backend (defaults to ``''``
 *   which resolves relative to the app origin).
 */
const fetchFreshCsrf = async (baseUrl: string = ''): Promise<void> => {
  const csrfResponse = await fetch(
    `${baseUrl}${CSRF_LOGIN_PATH}?t=${Date.now()}`,
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
    await CookieManager.setFromResponse(baseUrl, setCookie);
  }
};

/**
 * CSRF interceptor for Django CSRF protection (reactive / retry strategy).
 *
 * On a 403 response to a mutating request the interceptor fetches a fresh
 * CSRF token from the Django admin login endpoint and retries the request
 * **once**.
 *
 * @param baseUrl  Base URL of the Django backend.  Defaults to ``''``
 *   (resolve relative to the current origin).
 */
export const createCsrfInterceptor = (baseUrl: string = ''): FetchInterceptor => {
  return async (input, init, next) => {
    let response = await next(input, init);

    if (response.status === 403) {
      const method = (init.method || 'GET').toUpperCase();
      const isMutating = MUTATING_METHODS.includes(
        method as (typeof MUTATING_METHODS)[number]
      );

      if (isMutating) {
        await fetchFreshCsrf(baseUrl);
        response = await next(input, init);
      }
    }

    return response;
  };
};

/**
 * HMIS-specific interceptor for direct HMIS API calls
 * Request phase: Adds Bearer token auth and HMIS-required headers
 * Response phase: Extracts and stores api_url from Set-Cookie
 */
export const interceptorHmis: FetchInterceptor = async (input, init, next) => {
  const headers = new Headers(init.headers);
  const url = getUrl(input);

  // 1. Authorization Header
  const token = await getAuthTokenHmis();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // 2. Standard HMIS Headers
  headers.set(HEADER_NAMES.ACCEPT, HEADER_VALUES.ACCEPT_JSON_ALL);
  headers.set(
    HEADER_NAMES.X_REQUESTED_WITH,
    HEADER_VALUES.X_REQUESTED_WITH_AJAX
  );

  const response = await next(input, { ...init, headers });

  // 3. Capture API URL & Domain Context
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const splitCookies = splitCookiesString(setCookie);
    const parsed = parseCookies(splitCookies, { map: true });
    const apiUrlCookie = parsed['api_url'];

    let targetDomain: string | null = null;

    if (apiUrlCookie) {
      const decodedApiUrl = decodeURIComponent(apiUrlCookie.value);
      targetDomain = apiUrlCookie.domain
        ? `https://${apiUrlCookie.domain.replace(/^\./, '')}`
        : new URL(url).origin;

      await Promise.all([
        AsyncStorage.setItem(HMIS_API_URL_STORAGE_KEY, decodedApiUrl),
        AsyncStorage.setItem(HMIS_AUTH_DOMAIN_STORAGE_KEY, targetDomain),
      ]);
    } else {
      targetDomain = await AsyncStorage.getItem(HMIS_AUTH_DOMAIN_STORAGE_KEY);
    }

    // Only set cookies to the target domain if they explicitly match it
    if (targetDomain) {
      const host = new URL(targetDomain).hostname;

      const matchingCookies = splitCookies.filter((str) => {
        const domain = parseCookies(str)[0]?.domain?.replace(/^\./, '');
        return domain && (host === domain || host.endsWith(`.${domain}`));
      });

      await Promise.all(
        matchingCookies.map((str) =>
          CookieManager.setFromResponse(targetDomain, str)
        )
      );
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
