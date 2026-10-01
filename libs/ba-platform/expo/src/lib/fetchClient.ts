import {
  bodyInterceptor,
  includeCredentialsInterceptor,
} from '@monorepo/expo/shared/clients';
import {
  composeFetchInterceptors,
  type FetchInterceptor,
} from '@monorepo/fetch';
import {
  configureActiveOrgStorage,
  createCsrfInterceptor,
  createCsrfTokenRefresher,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_LOGIN_PATH,
} from '@monorepo/ba-platform';
import CookieManager from '@preeternal/react-native-cookie-manager';

import { expoActiveOrgStorage } from './activeOrgStorage';
import { createNativeTokenReader } from './csrfTokenProvider';

/**
 * Pre-composed Expo / React Native fetch client.
 *
 * Chains (in order):
 * 1. Proactive CSRF header injection (via ``CookieManager``)
 * 2. Body serialisation
 * 3. Credentials include
 *
 * App-specific interceptors (HMIS auth, user-agent, etc.) can be passed
 * via ``extraInterceptors`` — they are appended after the platform defaults.
 *
 * Returns a ``fetch``-compatible function.  Pass it to
 * ``EnvironmentSwitcherProvider`` (as ``fetch``) and to Apollo's
 * ``HttpLink`` (as the ``fetch`` option).
 */
export const createExpoFetchClient = (
  apiUrl: string,
  extraInterceptors: FetchInterceptor[] = [],
) => {
  // The active-org store lives in the platform-agnostic package and cannot
  // reach MMKV itself, so this is where the native-backed implementation goes
  // in — alongside createNativeTokenReader, for the same reason. Safe to
  // re-enter on an environment switch: installing does no I/O.
  configureActiveOrgStorage(expoActiveOrgStorage);

  return composeFetchInterceptors(
    createCsrfInterceptor(
      createNativeTokenReader(apiUrl),
      createCsrfTokenRefresher((header) =>
        CookieManager.setFromResponse(apiUrl, header),
      ),
      CSRF_COOKIE_NAME,
      CSRF_HEADER_NAME,
      CSRF_LOGIN_PATH,
    ),
    bodyInterceptor,
    includeCredentialsInterceptor,
    ...extraInterceptors,
  );
};
