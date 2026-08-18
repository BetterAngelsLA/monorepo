import { composeFetchInterceptors } from '@monorepo/fetch';
import {
  configureActiveOrgStorage,
  createCsrfInterceptor,
  createCsrfTokenRefresher,
  createOrgInterceptor,
  getActiveOrgId,
  includeCredentialsInterceptor,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
} from '@monorepo/ba-platform';
import { webActiveOrgStorage } from './activeOrgStorage';
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
export const createWebFetchClient = () => {
  // The active-org store lives in the platform-agnostic package and cannot
  // reach localStorage itself, so this is where the browser-backed
  // implementation goes in — alongside readCsrfToken, for the same reason.
  configureActiveOrgStorage(webActiveOrgStorage);

  return composeFetchInterceptors(
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
};
