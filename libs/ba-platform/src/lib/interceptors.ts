import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, CSRF_LOGIN_PATH, DEFAULT_ORG_STORAGE_KEY } from './constants';

import type { FetchInterceptor } from '@monorepo/apollo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { FetchInterceptor };

export type TokenReader = (name: string) => Promise<string | null>;
export type TokenRefresher = (loginPath: string) => Promise<void>;
export type StorageReader = { getItem: (key: string) => string | null | Promise<string | null> };

/**
 * Callback invoked after a CSRF token refresh so that the platform can
 * persist ``Set-Cookie`` headers.
 *
 * On web the browser handles this automatically — leave ``undefined``.
 * On React Native pass a function that calls ``CookieManager.setFromResponse``.
 */
export type CookiePersister = (setCookieHeader: string) => Promise<unknown>;

// ---------------------------------------------------------------------------
// CSRF Token Refresher (unified — works on web + React Native)
// ---------------------------------------------------------------------------

/**
 * Create a ``TokenRefresher`` that fetches a fresh CSRF token from the
 * Django admin login endpoint.
 *
 * @param baseUrl       Base URL of the Django backend.  Defaults to ``''``
 *                      (resolve relative to the current origin — web).
 * @param persistCookies  Optional — on React Native this should call
 *                        ``CookieManager.setFromResponse``.  On web the
 *                        browser handles ``Set-Cookie`` automatically.
 */
export const createCsrfTokenRefresher = (
  baseUrl: string = '',
  persistCookies?: CookiePersister,
): TokenRefresher =>
  async (loginPath: string) => {
    const url = `${baseUrl}${loginPath}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (persistCookies) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        try {
          await persistCookies(setCookie);
        } catch {
          // Non-critical — the reactive CSRF retry interceptor will
          // handle recovery on the next 403.
        }
      }
    }
  };

// ---------------------------------------------------------------------------
// CSRF Interceptor
// ---------------------------------------------------------------------------

/**
 * Inject a CSRF header into outgoing requests.
 *
 * Reads the token via ``readToken``, refreshes from the server if missing,
 * and sets the ``X-CSRFToken`` header (or a custom header name).
 */
export const createCsrfInterceptor = (
  readToken: TokenReader,
  refreshToken: TokenRefresher,
  cookieName: string = CSRF_COOKIE_NAME,
  headerName: string = CSRF_HEADER_NAME,
): FetchInterceptor =>
  async (_input, init, next) => {
    let token = await readToken(cookieName);
    if (!token) {
      await refreshToken(CSRF_LOGIN_PATH);
      token = await readToken(cookieName);
    }
    const headers = new Headers(init.headers);
    if (token) headers.set(headerName, token);
    return next(_input, { ...init, headers });
  };

// ---------------------------------------------------------------------------
// Org Interceptor
// ---------------------------------------------------------------------------

/**
 * Inject the ``X-Organization-ID`` header from a storage backend.
 */
export const createOrgInterceptor = (
  storage: StorageReader,
  storageKey: string = DEFAULT_ORG_STORAGE_KEY,
): FetchInterceptor =>
  async (_input, init, next) => {
    const orgId = await storage.getItem(storageKey);
    if (!orgId) return next(_input, init);
    const headers = new Headers(init.headers);
    headers.set('X-Organization-ID', orgId);
    return next(_input, { ...init, headers });
  };
