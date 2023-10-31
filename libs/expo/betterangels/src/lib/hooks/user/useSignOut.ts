import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import useUser from './useUser';

// TODO: this should be a function that is elsewhere, also needs to check SecureStorage if it is native
async function getCsrfToken() {
  if (Platform.OS === 'web') {
    // Look for the 'csrftoken' within the browser cookies
    const token = document.cookie
      .split('; ')
      .find((c) => c.includes('csrftoken='));
    return token ? token.split('=')[1] : '';
  } else {
    // Retrieve the token from SecureStore on non-web platforms
    return (await SecureStore.getItemAsync('csrftoken')) || '';
  }
}

export default function useSignOut() {
  const { setUser } = useUser();
  async function signOut(apiUrl: string) {
    try {
      // TODO: remove this, hack to get around apiUrl being turned into an object
      await fetch(`http://localhost:8000/rest-auth/logout/`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await getCsrfToken(),
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
