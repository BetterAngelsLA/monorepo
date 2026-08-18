import { useApolloClient, useMutation } from '@apollo/client/react';
import { clearActiveOrgId } from '@monorepo/ba-platform';
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
      // The next user on this browser must not inherit this one's active
      // organization, and the header must stop being sent immediately.
      clearActiveOrgId();
      setUser(undefined);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, client]);

  return { signOut, loading, error };
}
