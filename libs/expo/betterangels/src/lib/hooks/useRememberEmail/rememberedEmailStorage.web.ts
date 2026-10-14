/**
 * Web half of the remembered-email store; `rememberedEmailStorage.ts` is its
 * counterpart and must export the same three functions.
 *
 * `expo-secure-store`'s web build is an empty module (`export default {}`), so
 * its calls fail at use time and a browser has no OS keychain; the prefix below
 * keeps the hook's logical key identical on both platforms. `localStorage` is not
 * a secure store, which is acceptable because this only pre-fills the email
 * field — never tokens or credentials.
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
