import { composeFetchInterceptors } from '@monorepo/fetch';
import {
  createCsrfInterceptor,
  createCsrfTokenRefresher,
  createOrgInterceptor,
  getActiveOrgId,
  includeCredentialsInterceptor,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
} from '@monorepo/ba-platform';
import { readCsrfToken } from './csrfTokenProvider';

/**
 * Pre-composed web fetch client.
 *
 * Chains org-id injection + CSRF token refresh, backed by browser-native
 * localStorage and cookie APIs.  Returns a ``fetch``-compatible function.
 *
 * Pass the result to ``ApiConfigProvider`` (as ``fetch``) and to Apollo's
 * ``HttpLink`` (as the ``fetch`` option).
 */
export const createWebFetchClient = () =>
  composeFetchInterceptors(
    createOrgInterceptor(getActiveOrgId),
    createCsrfInterceptor(
      readCsrfToken,
      createCsrfTokenRefresher(),
      CSRF_COOKIE_NAME,
      CSRF_HEADER_NAME,
      CSRF_LOGIN_PATH,
    ),
    includeCredentialsInterceptor,
  );
