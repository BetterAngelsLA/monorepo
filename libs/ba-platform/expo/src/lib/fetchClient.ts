import {
  userAgentInterceptor,
  bodyInterceptor,
  includeCredentialsInterceptor,
  hmisAuthInterceptor,
  interceptorHmis,
} from '@monorepo/expo/shared/clients';
import {
  composeFetchInterceptors,
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
 * Pre-composed Expo / React Native fetch client.
 *
 * Chains (in order):
 * 1. Org-ID injection (from ``AsyncStorage``)
 * 2. Proactive CSRF header injection (via ``CookieManager``)
 * 3. User-Agent spoofing
 * 4. Body serialisation
 * 5. HMIS auth token injection
 * 6. Credentials include
 * 7. HMIS-specific cookie extraction
 *
 * Pass the result as the ``fetch`` option to Apollo's HTTP link or
 * ``ApiConfigProvider``.
 */
export const createExpoFetchClient = (baseUrl: string) =>
  composeFetchInterceptors(
    createOrgInterceptor(asyncStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
    createCsrfInterceptor(
      createNativeTokenReader(baseUrl),
      createCsrfTokenRefresher(baseUrl, (header) => CookieManager.setFromResponse(baseUrl, header)),
    ),
    userAgentInterceptor,
    bodyInterceptor,
    hmisAuthInterceptor,
    includeCredentialsInterceptor,
    interceptorHmis,
  );
