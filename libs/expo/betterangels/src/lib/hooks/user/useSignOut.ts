import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import useClearLocalSession from './useClearLocalSession';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const clearLocalSession = useClearLocalSession();
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }

    // Local teardown is shared with the /auth screen — see
    // `useClearLocalSession`.
    await clearLocalSession();
  }, [logout, clearLocalSession]);

  return { signOut, loading, error };
}
