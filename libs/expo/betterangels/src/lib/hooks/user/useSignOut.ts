import { gql, useMutation } from '@apollo/client';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { CSRF_COOKIE_NAME } from '../../constants';
import useAuthStore from '../useAuthStore';
import useUser from './useUser';

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export default function useSignOut() {
  const [logout, { loading, error }] = useMutation(LOGOUT_MUTATION);
  const { setUser } = useUser();
  const { deleteItem } = useAuthStore();

  const signOut = useCallback(async () => {
    try {
      await logout();
      setUser(undefined);
      router.replace('/auth');
      await deleteItem(CSRF_COOKIE_NAME);
    } catch (err) {
      console.error(err);
    }
  }, [logout, setUser, deleteItem]);

  return { signOut, loading, error };
}
