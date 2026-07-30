import { useApolloClient, useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { useUser } from '../../providers';
import { LogoutDocument } from './__generated__/auth.generated';

export default function useSignOut() {
  const client = useApolloClient();
  const { setUser } = useUser();
  const [logout, { loading, error }] = useMutation(LogoutDocument);

  const signOut = useCallback(async () => {
    try {
      await logout();
      await client.clearStore();
      setUser(undefined);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, client]);

  return { signOut, loading, error };
}
