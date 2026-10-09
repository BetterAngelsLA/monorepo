import { useCallback, useEffect, useState } from 'react';

/**
 * Web build of {@link useRememberedEmail}.
 *
 * `expo-secure-store`'s web build is an empty module (`export default {}`), so
 * every call throws `getValueWithKeyAsync is not a function`. A browser has no
 * OS keychain to fall back to, so this uses `localStorage`.
 *
 * Scope note: `localStorage` is readable by any script on the origin, so it is
 * not a secure store. That is acceptable here because this only pre-fills the
 * email field for convenience — never tokens or credentials.
 */
const STORAGE_PREFIX = 'ba.rememberedEmail.';

export function useRememberedEmail(storageKey: string) {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const webStorageKey = `${STORAGE_PREFIX}${storageKey}`;

  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem(webStorageKey);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Storage can be unavailable (private mode, blocked storage). The
      // pre-fill is a convenience, so failing silently is correct here.
    }
  }, [webStorageKey]);

  const persistOnSuccessfulSignIn = useCallback(
    async (finalEmail: string) => {
      const trimmed = finalEmail.trim();

      try {
        if (rememberMe && trimmed) {
          window.localStorage.setItem(webStorageKey, trimmed);
        } else {
          window.localStorage.removeItem(webStorageKey);
        }
      } catch {
        // Never block a successful sign-in on a storage failure.
      }
    },
    [rememberMe, webStorageKey],
  );

  return {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  };
}
