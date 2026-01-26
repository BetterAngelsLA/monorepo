import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { clearAllHmisCredentials } from '@monorepo/expo/shared/utils';
import { useCallback } from 'react';
import NitroCookies from 'react-native-nitro-cookies';
import useUser from './useUser';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);
  const { setUser } = useUser();

  const signOut = useCallback(async () => {
    try {
      await logout();
      await Promise.all([clearAllHmisCredentials(), NitroCookies.clearAll()]);
      setUser(undefined);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser]);

  return { signOut, loading, error };
}
