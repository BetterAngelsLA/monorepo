import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { useUser } from '@monorepo/react/shared';
import { LogoutDocument } from './__generated__/auth.generated';

export default function useSignOut() {
  const { setUser } = useUser();
  const [logout, { loading, error }] = useMutation(LogoutDocument);

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser]);

  return { signOut, loading, error };
}
