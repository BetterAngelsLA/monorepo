import { router } from 'expo-router';
import useAuthStore from '../useAuthStore';
import useUser from './useUser';

export default function useSignOut() {
  const { setUser } = useUser();
  const { getItem } = useAuthStore();

  async function signOut(apiUrl: string) {
    try {
      await fetch(`${apiUrl}/rest-auth/logout/`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await getItem('csrftoken'),
        },
      });
      setUser(undefined);
      router.replace('/');
    } catch (err) {
      console.error(err);
    }
  }

  return { signOut };
}
