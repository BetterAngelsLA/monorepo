import { gql, useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { CSRF_COOKIE_NAME } from '../../constants';
import { deleteItem } from '../../storage';
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
      await deleteItem(CSRF_COOKIE_NAME);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser]);

  return { signOut, loading, error };
}
