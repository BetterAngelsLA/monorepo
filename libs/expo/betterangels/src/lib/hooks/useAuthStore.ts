import { Platform } from 'react-native';
import { CSRF_COOKIE_NAME } from '../constants';
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
      const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);
      const csrfTokenMatch = cookies?.match(csrfTokenRegex);
      const csrfToken = csrfTokenMatch?.[1];
      if (csrfToken) {
        await setItem(CSRF_COOKIE_NAME, csrfToken);
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
