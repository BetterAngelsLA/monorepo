import { composeFetchInterceptors } from '@monorepo/apollo';
import { localStorageAdapter } from '@monorepo/react/shared';
import {
  createCsrfInterceptor,
  createOrgInterceptor,
  CSRF_COOKIE_NAME,
  DEFAULT_ORG_STORAGE_KEY,
} from '@monorepo/ba-platform';
import { readCsrfToken, refreshCsrfToken } from './csrfTokenProvider';

// Re-export for convenience so consumers don't need separate imports.
export { CSRF_COOKIE_NAME, DEFAULT_ORG_STORAGE_KEY };

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
    createCsrfInterceptor(readCsrfToken, refreshCsrfToken, CSRF_COOKIE_NAME),
  );
