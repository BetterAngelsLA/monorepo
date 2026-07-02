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
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
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
 * 3. Body serialisation
 * 4. Credentials include
 *
 * App-specific interceptors (HMIS auth, user-agent, etc.) can be passed
 * via ``extraInterceptors`` — they are appended after the platform defaults.
 *
 * Returns a ``fetch``-compatible function.  Pass it to
 * ``EnvironmentSwitcherProvider`` (as ``fetch``) and to Apollo's
 * ``UploadHttpLink`` (as the ``fetch`` option).
 */
export const createExpoFetchClient = (
  apiUrl: string,
  extraInterceptors: FetchInterceptor[] = [],
) =>
  composeFetchInterceptors(
    createOrgInterceptor(asyncStorageAdapter, DEFAULT_ORG_STORAGE_KEY),
    createCsrfInterceptor(
      createNativeTokenReader(apiUrl),
      createCsrfTokenRefresher(apiUrl, (header) => CookieManager.setFromResponse(apiUrl, header)),
      CSRF_COOKIE_NAME,
      CSRF_HEADER_NAME,
    ),
    bodyInterceptor,
    includeCredentialsInterceptor,
    ...extraInterceptors,
  );
