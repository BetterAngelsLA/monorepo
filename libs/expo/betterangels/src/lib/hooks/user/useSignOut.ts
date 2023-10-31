import { router } from 'expo-router';
import useUser from './useUser';

// TODO: this should be a function that is elsewhere, also needs to check SecureStorage if it is native
function getCsrfTokenFromCookies(): string {
  // Check if running in a web environment
  if (typeof document === 'object') {
    // Parse the document.cookie string
    const cookies = document.cookie.split('; ');
    const csrfCookie = cookies.find((cookie) =>
      cookie.startsWith('csrftoken=')
    );
    if (csrfCookie) {
      return csrfCookie.split('=')[1]; // Return the value part of the cookie
    }
  }
  return '';
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
          'X-CSRFToken': getCsrfTokenFromCookies(),
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
