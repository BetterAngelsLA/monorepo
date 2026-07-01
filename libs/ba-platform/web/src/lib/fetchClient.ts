import { composeFetchInterceptors } from '@monorepo/apollo';
import { localStorageAdapter } from '@monorepo/react/shared';
import {
  createCsrfInterceptor,
  createCsrfTokenRefresher,
  createOrgInterceptor,
  CSRF_COOKIE_NAME,
  DEFAULT_ORG_STORAGE_KEY,
} from '@monorepo/ba-platform';
import { readCsrfToken } from './csrfTokenProvider';

/**
 * Pre-composed web fetch client.
 *
 * Chains org-id injection + CSRF token refresh, backed by browser-native
 * localStorage and cookie APIs. Pass the result as the ``fetch`` option
 * to Apollo's ``UploadHttpLink`` or any other fetch consumer.
 */
export const createWebFetchClient = () =>
  composeFetchInterceptors(
    createOrgInterceptor(localStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
    createCsrfInterceptor(
      readCsrfToken,
      createCsrfTokenRefresher(),
      CSRF_COOKIE_NAME,
    ),
  );
