import { gql } from '@apollo/client';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import CookieManager from '@preeternal/react-native-cookie-manager';
import { useUser } from '../../providers/user/UserProvider';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const client = useApolloClient();
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);
  const { setUser } = useUser();

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    await CookieManager.clearAll();
    await client.clearStore();
    setUser(undefined);
  }, [logout, setUser, client]);

  return { signOut, loading, error };
}
