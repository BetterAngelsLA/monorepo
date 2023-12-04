import { router } from 'expo-router';
import { CSRF_COOKIE_NAME } from '../../constants';
import useAuthStore from '../useAuthStore';
import useUser from './useUser';

export default function useSignOut() {
  const { setUser } = useUser();
  const { getItem, deleteItem } = useAuthStore();

  async function signOut(apiUrl: string) {
    try {
      await fetch(`${apiUrl}/rest-auth/logout/`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': (await getItem(CSRF_COOKIE_NAME)) || '',
        },
      });
      setUser(undefined);
      router.replace('/auth');
      deleteItem(CSRF_COOKIE_NAME);
    } catch (err) {
      console.error(err);
    }
  }

  return { signOut };
}
