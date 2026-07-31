// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FetchInterceptor = (
  input: RequestInfo | URL,
  init: RequestInit,
  next: (input: RequestInfo | URL, init: RequestInit) => Promise<Response>
) => Promise<Response>;

export type TokenReader = (name: string) => Promise<string | null>;
export type TokenRefresher = (url: string) => Promise<void>;
export type StorageReader = { getItem: (key: string) => string | null | Promise<string | null> };

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
      (input: RequestInfo | URL, init: RequestInit) => fetch(input, init)
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
export const createCsrfInterceptor = (
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
// Org Interceptor
// ---------------------------------------------------------------------------

/**
 * Inject the ``X-Organization-ID`` header from a storage backend.
 */
export const createOrgInterceptor = (
  storage: StorageReader,
  storageKey = 'betterangels_active_org_id',
): FetchInterceptor =>
  async (_input, init, next) => {
    const orgId = await storage.getItem(storageKey);
    if (!orgId) return next(_input, init);
    const headers = new Headers(init.headers);
    headers.set('X-Organization-ID', orgId);
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
export const createCsrfTokenRefresher = (
  persistCookies?: CookiePersister,
): TokenRefresher =>
  async (url: string) => {
    const response = await fetch(`${url}?t=${Date.now()}`, { credentials: 'include' });

    if (persistCookies) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        try { await persistCookies(setCookie); } catch { /* non-critical */ }
      }
    }
  };
