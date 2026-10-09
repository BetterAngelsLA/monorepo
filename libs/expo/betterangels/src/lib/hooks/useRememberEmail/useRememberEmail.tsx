import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export function useRememberedEmail(storageKey: string) {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync(storageKey);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch {
        // The keychain can be unavailable (locked device, simulator, a corrupted
        // entry). Pre-filling the field is a convenience, so failing silently is
        // correct here — and without this an unhandled rejection is noise, not a
        // signal. The web build carries the same guard; see the `.web` sibling.
      }
    })();
  }, [storageKey]);

  const persistOnSuccessfulSignIn = useCallback(
    async (finalEmail: string) => {
      const trimmed = finalEmail.trim();

      try {
        if (rememberMe && trimmed) {
          await SecureStore.setItemAsync(storageKey, trimmed, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          });
        } else {
          await SecureStore.deleteItemAsync(storageKey);
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
