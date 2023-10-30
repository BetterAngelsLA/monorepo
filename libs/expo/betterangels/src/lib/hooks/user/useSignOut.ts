import { router } from 'expo-router';
import useUser from './useUser';

export default function useSignOut() {
  const { setUser } = useUser();
  async function signOut(apiUrl: string) {
    try {
      console.log('api url: ', apiUrl);
      const response = await fetch(`${apiUrl}/rest-auth/logout/`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const resp = await response.json();
      console.log('response: ', resp);
      setUser(undefined);
      router.replace('/');
    } catch (err) {
      console.error(err);
    }
  }

  return { signOut };
}
