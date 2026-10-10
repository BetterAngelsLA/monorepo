/**
 * Web counterpart of {@link clearSessionCookies}: deliberately a no-op.
 *
 * There is no JavaScript cookie jar to clear in a browser:
 * - the Django session cookie is `HttpOnly`, so JS can neither read nor clear it
 *   — the server clears it on logout, and an expired session is rejected
 *   server-side regardless;
 * - the CSRF cookie is readable, but clearing it buys nothing: the CSRF
 *   interceptor refreshes it on demand.
 *
 * The native jar is also what holds the HMIS `auth_token`; HMIS is not supported
 * on web, so there is nothing to clear for it either.
 *
 * Kept `async` so callers are identical on both platforms.
 */
export async function clearSessionCookies(): Promise<void> {
  // Intentionally empty — see the file comment.
}
