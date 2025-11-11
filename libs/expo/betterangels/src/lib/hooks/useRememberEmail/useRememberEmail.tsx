import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const KEYS = {
  EMAIL: 'login.email',
  REMEMBER: 'login.remember',
} as const;

export function useRememberedEmail() {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedRemember, savedEmail] = await Promise.all([
          SecureStore.getItemAsync(KEYS.REMEMBER),
          SecureStore.getItemAsync(KEYS.EMAIL),
        ]);
        const remember = savedRemember === 'true';
        setRememberMe(remember);
        if (remember && savedEmail) setEmail(savedEmail);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!hydrated) return;
      if (rememberMe) {
        await SecureStore.setItemAsync(KEYS.REMEMBER, 'true', {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(KEYS.REMEMBER),
          SecureStore.deleteItemAsync(KEYS.EMAIL),
        ]);
      }
    })();
  }, [rememberMe, hydrated]);

  const persistOnSuccessfulSignIn = useCallback(
    async (finalEmail: string) => {
      if (rememberMe && finalEmail.trim()) {
        await Promise.all([
          SecureStore.setItemAsync(KEYS.REMEMBER, 'true', {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          }),
          SecureStore.setItemAsync(KEYS.EMAIL, finalEmail.trim(), {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
          }),
        ]);
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(KEYS.REMEMBER),
          SecureStore.deleteItemAsync(KEYS.EMAIL),
        ]);
      }
    },
    [rememberMe]
  );

  return {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    hydrated,
    persistOnSuccessfulSignIn,
  };
}
