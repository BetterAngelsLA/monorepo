// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FetchInterceptor = (
  input: RequestInfo | URL,
  init: RequestInit,
  next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>
) => Promise<Response>;

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

/**
 * Compose multiple fetch interceptors into a single fetch-compatible function.
 *
 * Interceptors are composed **right-to-left** (the last interceptor wraps the
 * one before it).  The returned function has the same signature as ``fetch``
 * and can be passed directly to Apollo's HTTP link or any other fetch consumer.
 *
 * ```ts
 * const fetchClient = composeFetchInterceptors(org, csrf, body);
 * // fetchClient('/api/data', { method: 'POST' })
 * ```
 */
export const composeFetchInterceptors = (
  ...interceptors: FetchInterceptor[]
): ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  return (input: RequestInfo | URL, init: RequestInit = {}) => {
    const chain = interceptors.reduceRight<
      (input: RequestInfo | URL, init: RequestInit) => Promise<Response>
    >(
      (next, interceptor) => (input, init) => interceptor(input, init, next),
      (input: RequestInfo | URL, init: RequestInit) => fetch(input, init)
    );

    return chain(input, init);
  };
};
