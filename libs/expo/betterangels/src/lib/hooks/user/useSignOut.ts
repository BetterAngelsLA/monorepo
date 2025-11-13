import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import CookieManager from '@react-native-cookies/cookies';
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

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
      CookieManager.clearAll();
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser]);

  return { signOut, loading, error };
}
