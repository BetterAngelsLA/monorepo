import { composeFetchInterceptors } from '@monorepo/apollo';
import { localStorageAdapter } from '@monorepo/react/shared';
import { readCsrfToken, refreshCsrfToken } from './csrfTokenProvider';
import {
  createCsrfInterceptor,
  createOrgInterceptor,
} from './interceptors';
import { CSRF_COOKIE_NAME, DEFAULT_ORG_STORAGE_KEY } from './constants';

// Re-export for convenience so consumers don't need separate imports.
export { CSRF_COOKIE_NAME, DEFAULT_ORG_STORAGE_KEY };

/**
 * Pre-composed web fetch client.
 *
 * Chains org-id injection + CSRF token refresh, backed by browser-native
 * localStorage and cookie APIs. Pass the result as the ``fetch`` option
 * to Apollo's ``UploadHttpLink`` or any other fetch consumer.
 *
 * TODO: move to ``@monorepo/ba-platform/web`` when the web entry point
 * graduates to a separate NX project (per ``docs/styleguides/nx.md``).
 */
export const createWebFetchClient = () =>
  composeFetchInterceptors(
    createOrgInterceptor(localStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
    createCsrfInterceptor(readCsrfToken, refreshCsrfToken, CSRF_COOKIE_NAME),
  );
