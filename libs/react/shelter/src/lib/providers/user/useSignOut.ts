import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { LogoutDocument } from './__generated__/logout.generated';

export function useSignOut() {
  const [logout, { loading, error }] = useMutation(LogoutDocument);

  const signOut = useCallback(async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    }
  }, [logout]);

  return { signOut, loading, error };
}
