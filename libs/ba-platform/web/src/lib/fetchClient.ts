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
 * The dev proxy's target prefix in an API URL, if it has one: `/__api/dev` →
 * `dev`. Empty for a URL that points straight at an API.
 */
function readProxyPrefix(apiUrl?: string): {
  prefix: string;
  target: string | null;
} {
  const path = (() => {
    if (!apiUrl) return '';
    if (apiUrl.startsWith('/')) return apiUrl;

    try {
      return new URL(apiUrl).pathname;
    } catch {
      return '';
    }
  })();

  const segments = path.replace(/\/+$/, '').split('/');

  // ['', '__api', 'dev'] — the proxy mounts each target one segment deep. This
  // literal is `DEV_API_PROXY_PREFIX` (`apps/betterangels/src/apiEnvironments.ts`),
  // repeated because the app depends on this lib and not the other way round.
  return segments[1] === '__api' && segments[2]
    ? { prefix: `/${segments[1]}/${segments[2]}`, target: segments[2] }
    : { prefix: '', target: null };
}

/**
 * Pre-composed web fetch client.
 *
 * Chains org-id injection + CSRF token refresh, backed by browser-native
 * localStorage and cookie APIs.  Returns a ``fetch``-compatible function.
 *
 * Pass the result to ``ApiConfigProvider`` (as ``fetch``) and to Apollo's
 * ``HttpLink`` (as the ``fetch`` option).
 *
 * ``apiUrl`` is the same URL the requests go to, and matters only when it is a
 * dev-proxy target (`/__api/<target>`): the CSRF bootstrap then lives under that
 * prefix, and the token cookie is the namespaced one, because the proxy keeps each
 * target's cookies apart on a shared origin. A direct API origin needs neither —
 * both fall back to the plain constants.
 */
export const createWebFetchClient = (apiUrl?: string) => {
  // The active-org store lives in the platform-agnostic package and cannot
  // reach localStorage itself, so this is where the browser-backed
  // implementation goes in — alongside readCsrfToken, for the same reason.
  configureActiveOrgStorage(webActiveOrgStorage);

  const { prefix, target } = readProxyPrefix(apiUrl);

  return composeFetchInterceptors(
    createOrgInterceptor(getActiveOrgId),
    createCsrfInterceptor(
      readCsrfToken,
      createCsrfTokenRefresher(),
      target ? `${target}_${CSRF_COOKIE_NAME}` : CSRF_COOKIE_NAME,
      CSRF_HEADER_NAME,
      prefix ? `${prefix}${CSRF_LOGIN_PATH}` : CSRF_LOGIN_PATH,
    ),
    includeCredentialsInterceptor,
  );
};
