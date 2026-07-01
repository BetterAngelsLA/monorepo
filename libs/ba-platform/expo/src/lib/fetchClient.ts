import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import {
  bodyInterceptor,
  includeCredentialsInterceptor,
} from '@monorepo/expo/shared/clients';
import {
  composeFetchInterceptors,
  type FetchInterceptor,
} from '@monorepo/fetch';
import {
  createCsrfInterceptor,
  createCsrfTokenRefresher,
  createOrgInterceptor,
  DEFAULT_ORG_STORAGE_KEY,
} from '@monorepo/ba-platform';
import CookieManager from '@preeternal/react-native-cookie-manager';
import { asyncStorageAdapter } from '@monorepo/expo/shared/utils';

import { createNativeTokenReader } from './csrfTokenProvider';

/**
 * Pre-composed Expo / React Native fetch client + Apollo HTTP link.
 *
 * Chains (in order):
 * 1. Org-ID injection (from ``AsyncStorage``)
 * 2. Proactive CSRF header injection (via ``CookieManager``)
 * 3. Body serialisation
 * 4. Credentials include
 *
 * App-specific interceptors (HMIS auth, user-agent, etc.) can be passed
 * via ``extraInterceptors`` — they are appended after the platform defaults.
 *
 * Returns a ``fetch`` function (pass to ``ApiConfigProvider`` /
 * ``EnvironmentSwitcherProvider``) and a pre-configured ``UploadHttpLink``
 * (pass to ``ApolloClientProvider``).
 */
export const createExpoFetchClient = (
  apiUrl: string,
  extraInterceptors: FetchInterceptor[] = [],
) => {
  const fetch = composeFetchInterceptors(
    createOrgInterceptor(asyncStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
    createCsrfInterceptor(
      createNativeTokenReader(apiUrl),
      createCsrfTokenRefresher(apiUrl, (header) => CookieManager.setFromResponse(apiUrl, header)),
    ),
    bodyInterceptor,
    includeCredentialsInterceptor,
    ...extraInterceptors,
  );

  const link = new UploadHttpLink({ uri: `${apiUrl}/graphql`, fetch });

  return { fetch, link };
};
