// csrfManager.ts
import CookieManager from '@react-native-cookies/cookies';
import { Platform } from 'react-native';
import { CSRF_COOKIE_NAME } from './constants';

/**
 * A simplified CSRF token manager.
 *
 * On web, it uses document.cookie; on React Native, it uses CookieManager.
 * If no token is found, it will trigger a fetch (with credentials included)
 * to force the backend to set the cookie, then try to read it again.
 */
class CSRFTokenManager {
  async getToken(apiUrl: string): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === 'web') {
      token = this.getTokenFromDocument();
    } else {
      try {
        const cookies = await CookieManager.get(apiUrl);
        token = cookies[CSRF_COOKIE_NAME]?.value || null;
      } catch (error) {
        console.error('Error retrieving cookies:', error);
      }
    }

    // If token is not found, perform a fetch to trigger the cookie being set.
    if (!token) {
      try {
        await fetch(apiUrl, { credentials: 'include' });
        if (Platform.OS === 'web') {
          token = this.getTokenFromDocument();
        } else {
          const cookies = await CookieManager.get(apiUrl);
          token = cookies[CSRF_COOKIE_NAME]?.value || null;
        }
      } catch (error) {
        console.error('Error fetching to set CSRF token:', error);
      }
    }

    return token;
  }

  private getTokenFromDocument(): string | null {
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(
        new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`)
      );
      return match ? match[1] : null;
    }
    return null;
  }

  async clearToken(apiUrl: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Clear by setting the cookie's expiration to the past.
      document.cookie = `${CSRF_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      try {
        // This assumes CookieManager supports clearByName (most do).
        await CookieManager.clearByName(apiUrl, CSRF_COOKIE_NAME);
      } catch (e) {
        console.error('Error clearing cookie', e);
      }
    }
  }
}

export const csrfManager = new CSRFTokenManager();
