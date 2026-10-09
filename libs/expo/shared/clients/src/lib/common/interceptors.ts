/**
 * Fetch interceptor system for composable request/response handling
 *
 * The interceptors in this module are platform-neutral. The direct-HMIS ones
 * are not: the native implementation reads `Set-Cookie` off responses and
 * copies the cookies into the native jar by hand, which is impossible in a
 * browser. Those live in `./hmisInterceptors` with a `.web.ts` counterpart and
 * are re-exported below so this module's public surface is unchanged.
 */

import type { FetchInterceptor } from '@monorepo/fetch';
import {
  HEADER_NAMES,
  HEADER_VALUES,
  MODERN_BROWSER_USER_AGENT,
} from './constants';

export type HeadersObject = Record<string, string>;

// Keeps the exports that consumers already import from this path (both the
// package barrel and direct `../common/interceptors` imports) working.
export * from './hmisStorageKeys';
export * from './hmisInterceptors';

/**
 * Detect FormData-like objects via `append` method.
 * Avoids unreliable `instanceof FormData` checks in React Native.
 */
type FormDataLike = {
  append: (...args: unknown[]) => unknown;
};

function isFormDataLike(value: unknown): value is FormDataLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'append' in value &&
    typeof (value as FormDataLike).append === 'function'
  );
}

// ============================================================================
// INTERCEPTORS
// ============================================================================

/**
 * Adds User-Agent header for browser compatibility
 */
export const userAgentInterceptor: FetchInterceptor = async (
  input,
  init,
  next,
) => {
  const headers = new Headers(init.headers);
  headers.set(HEADER_NAMES.USER_AGENT, MODERN_BROWSER_USER_AGENT);

  return next(input, { ...init, headers });
};

/**
 * Adds Referer header.  When ``referer`` is omitted the header is not sent
 */
export const createRefererInterceptor = (
  referer?: string,
): FetchInterceptor => {
  return async (input, init, next) => {
    if (referer === undefined) return next(input, init);
    const headers = new Headers(init.headers);
    headers.set(HEADER_NAMES.REFERER, referer);
    return next(input, { ...init, headers });
  };
};

/**
 * Body handling interceptor - serializes objects to JSON and sets Content-Type
 */
export const bodyInterceptor: FetchInterceptor = async (input, init, next) => {
  const headers = new Headers(init.headers);
  let body = init.body;

  const isFormData = isFormDataLike(body);

  if (body && !isFormData && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  // Set Content-Type header if there's a body and it's not already set.
  // For FormData, let fetch set the header (it adds the multipart boundary).
  if (body && !isFormData && !headers.has(HEADER_NAMES.CONTENT_TYPE)) {
    headers.set(HEADER_NAMES.CONTENT_TYPE, HEADER_VALUES.CONTENT_TYPE_JSON);
  }

  return next(input, { ...init, headers, body });
};

/**
 * Sets credentials: 'include' to enable cookie handling
 */
export const includeCredentialsInterceptor: FetchInterceptor = async (
  input,
  init,
  next,
) => {
  return next(input, { ...init, credentials: 'include' });
};
