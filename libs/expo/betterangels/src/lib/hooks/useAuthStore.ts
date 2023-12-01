import { Platform } from 'react-native';
import { CSRF_TOKEN } from '../constants';
import { deleteItem, getItem, setItem } from '../storage';

/**
 * This store is used mainly to handle csrf token management between react native and
 * react web.
 * React web will use the regular cookie store
 * React native will use expo secure store
 */
export default function useAuthStore() {
  async function setCsrfCookieFromResponse(response: Response) {
    if (Platform.OS !== 'web') {
      const cookies = response.headers.get('Set-Cookie');
      const csrfToken = cookies && /csrftoken=([^;]+);/.exec(cookies)?.[1];
      if (csrfToken) {
        await setItem(CSRF_TOKEN, csrfToken);
      } else {
        console.error('CSRF token not found in the response headers.');
      }
    }
  }

  return {
    setCsrfCookieFromResponse,
    setItem,
    getItem,
    deleteItem,
  };
}
