/**
 * Web counterpart of {@link clearSessionCookies}: deliberately a no-op. There is
 * no JS cookie jar — the Django session cookie is `HttpOnly`, and the CSRF
 * interceptor refreshes its own cookie on demand.
 *
 * Kept `async` so callers are identical on both platforms.
 */
export async function clearSessionCookies(): Promise<void> {
  // Intentionally empty — see the file comment.
}
