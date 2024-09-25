import { gql, useMutation } from '@apollo/client';
import { useApolloClientContext } from '@monorepo/expo/shared/apollo';
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
  const { switchToProduction } = useApolloClientContext(); // Social is only available in production

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
      switchToProduction();
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, switchToProduction]);

  return { signOut, loading, error };
}
