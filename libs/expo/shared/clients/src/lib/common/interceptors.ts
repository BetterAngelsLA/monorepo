/**
 * Reusable fetch interceptors for adding headers and handling auth
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

/**
 * Adds User-Agent header for browser compatibility
 */
export const userAgentInterceptor = (): HeadersObject => ({
  [HEADER_NAMES.USER_AGENT]: MODERN_BROWSER_USER_AGENT,
});

/**
 * Adds Content-Type header for JSON requests
 */
export const contentTypeInterceptor = (hasBody: boolean): HeadersObject =>
  hasBody
    ? { [HEADER_NAMES.CONTENT_TYPE]: HEADER_VALUES.CONTENT_TYPE_JSON }
    : {};

/**
 * Adds Referer header
 */
export const refererInterceptor = (referer: string): HeadersObject => ({
  [HEADER_NAMES.REFERER]: referer,
});

/**
 * Adds backend authentication headers (cookies, CSRF token, HMIS token)
 */
export const backendAuthInterceptor = (): HeadersObject => {
  const { cookieHeader, csrfToken, hmisToken } =
    authStorage.getCookiesForRequest();

  return {
    ...(cookieHeader && { [HEADER_NAMES.COOKIE]: cookieHeader }),
    ...(csrfToken && { [CSRF_HEADER_NAME]: csrfToken }),
    ...(hmisToken && { [HMIS_TOKEN_HEADER_NAME]: hmisToken }),
  };
};

/**
 * Adds Bearer token auth for direct HMIS API calls
 */
export const hmisAuthInterceptor = (): HeadersObject => {
  const authToken = authStorage.getCookieValue(HMIS_AUTH_COOKIE_NAME);

  if (!authToken) {
    throw new Error('Not authenticated with HMIS');
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};

/**
 * Ensures CSRF token exists before mutating requests
 */
export const ensureCsrfToken = async (
  referer: string,
  method: string
): Promise<void> => {
  if (!MUTATING_METHODS.includes(method as any)) return;

  const hasCsrf = !!authStorage.getCookieValue(CSRF_COOKIE_NAME);
  if (!hasCsrf) {
    const response = await fetch(`${referer}${CSRF_LOGIN_PATH}`, {
      headers: { [HEADER_NAMES.ACCEPT]: HEADER_VALUES.ACCEPT_HTML },
      credentials: 'omit',
    });
    authStorage.updateFromSetCookieHeaders(response.headers as any);
  }
};

/**
 * Stores cookies from response Set-Cookie headers
 */
export const storeCookiesInterceptor = (response: Response): void => {
  authStorage.updateFromSetCookieHeaders(response.headers as any);
};

/**
 * Logs authentication failures
 */
export const logAuthFailureInterceptor = (
  url: string,
  status: number
): void => {
  if (status === 401 || status === 403) {
    console.error('[fetch] Auth failure', { url, status });
  }
};
