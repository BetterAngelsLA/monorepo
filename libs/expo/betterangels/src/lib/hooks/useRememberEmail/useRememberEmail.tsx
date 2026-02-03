import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export function useRememberedEmail(storageKey: string) {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      const savedEmail = await SecureStore.getItemAsync(storageKey);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    })();
  }, [storageKey]);

  const persistOnSuccessfulSignIn = useCallback(
    async (finalEmail: string) => {
      const trimmed = finalEmail.trim();

      if (rememberMe && trimmed) {
        await SecureStore.setItemAsync(storageKey, trimmed, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await SecureStore.deleteItemAsync(storageKey);
      }
    },
    [rememberMe, storageKey]
  );

  return {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  };
}
