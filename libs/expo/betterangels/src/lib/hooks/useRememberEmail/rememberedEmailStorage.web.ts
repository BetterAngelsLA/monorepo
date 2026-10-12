/**
 * Web half of the remembered-email store; `rememberedEmailStorage.ts` is its
 * counterpart and must export the same three functions.
 *
 * `expo-secure-store`'s web build is an empty module (`export default {}`), so
 * its calls fail at use time and a browser has no OS keychain to fall back to.
 * The prefix lives here so the hook's storage key is the same logical key on
 * both platforms.
 *
 * Scope note: `localStorage` is readable by any script on the origin, so it is
 * not a secure store. That is acceptable because this only pre-fills the email
 * field for convenience — never tokens or credentials.
 */
const STORAGE_PREFIX = 'ba.rememberedEmail.';

function withPrefix(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export async function loadRememberedEmail(key: string): Promise<string | null> {
  return window.localStorage.getItem(withPrefix(key));
}

export async function saveRememberedEmail(
  key: string,
  value: string,
): Promise<void> {
  window.localStorage.setItem(withPrefix(key), value);
}

export async function clearRememberedEmail(key: string): Promise<void> {
  window.localStorage.removeItem(withPrefix(key));
}
