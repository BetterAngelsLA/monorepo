import { useCallback } from 'react';
import useUser from '../user/useUser';
import { useLogoutMutation } from './__generated__/auth.generated';

export default function useSignOut() {
  const { setUser } = useUser();
  const [logout, { loading, error }] = useLogoutMutation();

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
