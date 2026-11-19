// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FetchInterceptor = (
  input: RequestInfo | URL,
  init: RequestInit,
  next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>,
) => Promise<Response>;

export type TokenReader = (name: string) => Promise<string | null>;
export type TokenRefresher = (url: string) => Promise<void>;

/**
 * Callback invoked after a CSRF token refresh so that the platform can
 * persist ``Set-Cookie`` headers.
 *
 * On web the browser handles this automatically — pass ``undefined``.
 * On React Native pass a function that calls ``CookieManager.setFromResponse``.
 */
export type CookiePersister = (setCookieHeader: string) => Promise<unknown>;

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
      (input: RequestInfo | URL, init: RequestInit) => fetch(input, init),
    );

    return chain(input, init);
  };
};

// ---------------------------------------------------------------------------
// CSRF Interceptor (proactive header injection)
// ---------------------------------------------------------------------------

/**
 * Resolve a ``RequestInfo | URL`` to a plain string URL.
 */
const resolveRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
};

/**
 * Inject a CSRF header into outgoing requests (proactive strategy).
 *
 * Reads the token via ``readToken``, refreshes from the server if missing,
 * and sets the ``X-CSRFToken`` header (or a custom header name).
 *
 * The CSRF refresh URL is derived from the **request origin** — for
 * absolute URLs (cross-origin deployments) the refresh targets the API
 * domain; for relative URLs (local dev / same-origin) the relative
 * ``loginPath`` is used as-is.  This avoids baking a ``baseUrl`` into
 * the fetch client factory.
 *
 * Unlike the legacy reactive approach (send request → catch 403 → refresh
 * → retry), this interceptor resolves the token **before** the first
 * request leaves the client.  This eliminates a wasted round-trip for
 * every mutating request.
 *
 * **Trade-off:** If the token is missing AND the refresh fails (e.g.
 * offline), the interceptor **throws** and the request is never sent.
 * The old reactive strategy would send the request anyway and let the
 * server respond with 403.  In practice this is acceptable — if you
 * cannot reach the server to refresh the token, you likely cannot reach
 * the API endpoint either.
 *
 * Platform-agnostic — pass platform-specific ``TokenReader`` /
 * ``TokenRefresher`` implementations.
 */
export const createCsrfInterceptor =
  (
    readToken: TokenReader,
    refreshToken: TokenRefresher,
    cookieName = 'csrftoken',
    headerName = 'x-csrftoken',
    loginPath = '/admin/login/',
  ): FetchInterceptor =>
  async (_input, init, next) => {
    let token = await readToken(cookieName);
    if (!token) {
      const requestUrl = resolveRequestUrl(_input);
      // Derive the API origin from the request URL so the CSRF refresh
      // targets the correct domain in cross-origin deployments.
      // Falls back to relative path for same-origin (local dev).
      const baseUrl = requestUrl.startsWith('http')
        ? new URL(requestUrl).origin
        : '';
      await refreshToken(`${baseUrl}${loginPath}`);
      token = await readToken(cookieName);
    }
    const headers = new Headers(init.headers);
    if (token) headers.set(headerName, token);
    return next(_input, { ...init, headers });
  };

// ---------------------------------------------------------------------------
// Credentials Interceptor
// ---------------------------------------------------------------------------

/**
 * Sets ``credentials: 'include'`` on every request so the browser sends
 * cookies (including the CSRF cookie) with cross-origin requests.
 */
export const includeCredentialsInterceptor: FetchInterceptor = async (
  input,
  init,
  next,
) => next(input, { ...init, credentials: 'include' });

/**
 * Create a ``TokenRefresher`` that fetches a fresh CSRF token from the
 * Django admin login endpoint.
 *
 * The interceptor passes the full refresh URL (derived from the request
 * origin), so this function just fetches it with cache-busting.
 *
 * @param persistCookies  Optional — on React Native pass a function that
 *                        calls ``CookieManager.setFromResponse``.
 */
export const createCsrfTokenRefresher =
  (persistCookies?: CookiePersister): TokenRefresher =>
  async (url: string) => {
    const response = await fetch(`${url}?t=${Date.now()}`, {
      credentials: 'include',
    });

    if (persistCookies) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        try {
          await persistCookies(setCookie);
        } catch {
          /* non-critical */
        }
      }
    }
  };

// ---------------------------------------------------------------------------
// Client version interceptor
// ---------------------------------------------------------------------------

/**
 * Header carrying the identity of the build that made the request.
 *
 * Sent on every request so a report like "the browser version shows a blank
 * screen" can be tied to a specific bundle in the server logs. Without it the
 * only client signal in a request log is the user agent, which is identical
 * across every revision of the app — including the ones a long-lived tab is
 * still running after a deploy.
 */
export const CLIENT_VERSION_HEADER = 'x-client-version';

/**
 * Tag outgoing requests with the caller's build identity.
 *
 * The value is read per request rather than captured once, because a native
 * build can move to a new OTA update without a process restart on some
 * platforms, and because tests substitute it. Returning a falsy value from
 * the reader omits the header entirely rather than sending `"undefined"`.
 *
 * An existing header is never overwritten: a caller that already knows a more
 * specific version wins.
 *
 * Place it **last** in `composeFetchInterceptors`. That composition is a
 * `reduceRight`, so the last interceptor is the innermost one and runs after
 * every other: at that point the request is final, and nothing downstream can
 * replace the headers it was just added to. (Being last does *not* make the
 * value visible to the others — if a future interceptor needs to read it, this
 * has to move first.)
 */
export const createClientVersionInterceptor =
  (
    readVersion: () => string | null | undefined,
    headerName: string = CLIENT_VERSION_HEADER,
  ): FetchInterceptor =>
  async (input, init, next) => {
    const version = readVersion();

    if (!version) {
      return next(input, init);
    }

    const headers = new Headers(init.headers);

    if (!headers.has(headerName)) {
      headers.set(headerName, version);
    }

    return next(input, { ...init, headers });
  };
