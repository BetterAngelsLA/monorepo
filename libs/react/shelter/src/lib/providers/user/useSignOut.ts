import { useApolloClient, useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearActiveOrgId, LogoutDocument } from '@monorepo/ba-platform';
import { useUser } from './UserProvider';

export function useSignOut() {
  const client = useApolloClient();
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [logout, { loading, error }] = useMutation(LogoutDocument);

  const signOut = useCallback(async () => {
    try {
      await logout();
      // The next user must not inherit this one's organization.
      clearActiveOrgId();
      setUser(undefined);
      navigate('/');
      await client.resetStore();
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, navigate, client]);

  return { signOut, loading, error };
}
