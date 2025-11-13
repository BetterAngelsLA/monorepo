import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

const EMAIL_KEY = 'login.email';

export function useRememberedEmail() {
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      const savedEmail = await SecureStore.getItemAsync(EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    })();
  }, []);

  const persistOnSuccessfulSignIn = useCallback(
    async (finalEmail: string) => {
      const trimmed = finalEmail.trim();

      if (rememberMe && trimmed) {
        await SecureStore.setItemAsync(EMAIL_KEY, trimmed, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await SecureStore.deleteItemAsync(EMAIL_KEY);
      }
    },
    [rememberMe]
  );

  return {
    email,
    setEmail,
    rememberMe,
    setRememberMe,
    persistOnSuccessfulSignIn,
  };
}
