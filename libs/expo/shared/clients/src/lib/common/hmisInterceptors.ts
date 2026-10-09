/**
 * Direct-HMIS fetch interceptors — **native build**.
 *
 * HMIS is a separate origin with its own cookie-based session, and React Native
 * has no ambient cookie jar, so this module reads `Set-Cookie` off HMIS
 * responses and copies the cookies into the native jar by hand.
 *
 * That mechanism is impossible in a browser (`Set-Cookie` is a forbidden
 * response header, so `response.headers.get('set-cookie')` is always `null`),
 * which is why this file has a `.web.ts` counterpart that is inert. HMIS support
 * on web is deferred — see `docs/outreach-web.md`.
 */
import type { FetchInterceptor } from '@monorepo/fetch';
import {
  HMIS_AUTH_COOKIE_NAME,
  HMIS_TOKEN_HEADER_NAME,
} from '@monorepo/expo/shared/utils';
import CookieManager from '@preeternal/react-native-cookie-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parse as parseCookies, splitCookiesString } from 'set-cookie-parser';
import { HEADER_NAMES, HEADER_VALUES } from './constants';
import {
  HMIS_API_URL_STORAGE_KEY,
  HMIS_AUTH_DOMAIN_STORAGE_KEY,
} from './hmisStorageKeys';

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

/**
 * Injects the HMIS token header for authenticated HMIS API requests.
 *
 * CSRF header injection is handled separately by the ba-platform
 * ``createCsrfInterceptor`` (proactive).
 */
export const hmisAuthInterceptor: FetchInterceptor = async (
  _input,
  init,
  next,
) => {
  const tokenHmis = await getAuthTokenHmis();
  if (!tokenHmis) return next(_input, init);

  const headers = new Headers(init.headers);
  headers.set(HMIS_TOKEN_HEADER_NAME, tokenHmis);
  return next(_input, { ...init, headers });
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
    HEADER_VALUES.X_REQUESTED_WITH_AJAX,
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
          CookieManager.setFromResponse(targetDomain, str),
        ),
      );
    }
  }

  return response;
};
