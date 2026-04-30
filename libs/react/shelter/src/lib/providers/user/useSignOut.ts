import { useApolloClient, useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutDocument } from './__generated__/logout.generated';
import { useUser } from './useUser';

export function useSignOut() {
  const client = useApolloClient();
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [logout, { loading, error }] = useMutation(LogoutDocument);

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
      navigate('/');
      await client.resetStore();
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, navigate, client]);

  return { signOut, loading, error };
}
