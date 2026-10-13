import { useCallback, useEffect, useState } from 'react';
import {
  clearRememberedEmail,
  loadRememberedEmail,
  saveRememberedEmail,
} from './rememberedEmailStorage';

export function useRememberedEmail(storageKey: string) {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedEmail = await loadRememberedEmail(storageKey);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch {
        // Storage can be unavailable (locked keychain, private-mode browser, a
        // corrupted entry). Pre-filling the field is a convenience, so failing
        // silently is correct here — and without this an unhandled rejection is
        // noise, not a signal.
      }
    })();
  }, [storageKey]);

  const persistOnSuccessfulSignIn = useCallback(
    async (finalEmail: string) => {
      const trimmed = finalEmail.trim();

      try {
        if (rememberMe && trimmed) {
          await saveRememberedEmail(storageKey, trimmed);
        } else {
          await clearRememberedEmail(storageKey);
        }
      } catch {
        // Never block a successful sign-in on a storage failure: the caller
        // awaits this *after* the credentials were accepted, so throwing here
        // would surface a storage error as a failed login.
      }
    },
    [rememberMe, storageKey],
  );

  return {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  };
}
