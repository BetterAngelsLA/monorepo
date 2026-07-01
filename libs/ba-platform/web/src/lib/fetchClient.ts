import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { composeFetchInterceptors } from '@monorepo/fetch';
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
 * Pre-composed web fetch client + Apollo HTTP link.
 *
 * Chains org-id injection + CSRF token refresh, backed by browser-native
 * localStorage and cookie APIs.  Returns a ``fetch`` function and a
 * pre-configured ``UploadHttpLink`` ready for ``ApolloClientProvider``.
 */
export const createWebFetchClient = (apiUrl: string) => {
  const fetch = composeFetchInterceptors(
    createOrgInterceptor(localStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
    createCsrfInterceptor(
      readCsrfToken,
      createCsrfTokenRefresher(),
      CSRF_COOKIE_NAME,
    ),
  );

  const link = new UploadHttpLink({ uri: `${apiUrl}/graphql`, fetch });

  return { fetch, link };
};
