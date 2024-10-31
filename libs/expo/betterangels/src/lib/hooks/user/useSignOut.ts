import { gql, useMutation } from '@apollo/client';
import { useApiConfig } from '@monorepo/expo/shared/clients';
import { useCallback } from 'react';
import useUser from './useUser';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);
  const { setUser } = useUser();
  const { switchEnvironment } = useApiConfig();

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
      switchEnvironment('production');
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, switchEnvironment]);

  return { signOut, loading, error };
}
