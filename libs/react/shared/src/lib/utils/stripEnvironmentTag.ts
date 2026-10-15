/**
 * Strip the environment tag a user types into the email field (`+local`,
 * `+demo`).
 *
 * The tag only picks an API environment on the client, so it must never reach
 * the backend — that address does not exist there, and sign-in fails as if the
 * account were missing. `+demo` is applied first because a tagged demo address
 * can carry both (`user+local+demo@…`).
 */
export function stripEnvironmentTag(email: string): string {
  return email.replace('+demo@', '@').replace('+local@', '@');
}
