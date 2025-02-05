// csrf-manager.ts
import { getItem, setItem } from '@monorepo/expo/shared/utils';
import { CSRF_COOKIE_NAME } from './constants';

class CSRFTokenManager {
  private currentToken: string | null = null;
  private inProgress = new Map<string, Promise<string | null>>();

  // Compute a storage key based on the API URL.
  private getKey(apiUrl: string): string {
    try {
      const origin = new URL(apiUrl).origin.replace(/[^a-zA-Z0-9]/g, '_');
      return `${CSRF_COOKIE_NAME}_${origin}`;
    } catch {
      return `${CSRF_COOKIE_NAME}_${apiUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  }

  async getToken(apiUrl: string, customFetch = fetch): Promise<string | null> {
    const key = this.getKey(apiUrl);

    // Check the in‑memory cache first.
    if (this.currentToken) return this.currentToken;

    // Then try AsyncStorage.
    const stored = await getItem(key);
    if (stored) {
      this.currentToken = stored;
      return stored;
    }

    // If a request is already in progress, return its promise.
    if (this.inProgress.has(key)) {
      const pending = this.inProgress.get(key);
      if (pending !== undefined) {
        return pending;
      }
    }

    // Otherwise, start a new request.
    const promise = (async () => {
      try {
        const res = await customFetch(apiUrl, { credentials: 'include' });
        const cookieHeader = res.headers?.get('Set-Cookie') || '';
        const match = cookieHeader.match(
          new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`)
        );
        const token = match ? match[1] : null;
        if (token) {
          this.currentToken = token;
          await setItem(key, token);
        }
        return token;
      } catch (error) {
        console.error('CSRF token fetch failed:', error);
        return null;
      } finally {
        this.inProgress.delete(key);
      }
    })();

    this.inProgress.set(key, promise);
    return promise;
  }

  async updateTokenFromCookies(apiUrl: string, cookies: string): Promise<void> {
    const key = this.getKey(apiUrl);
    const match = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
    if (match) {
      const token = match[1];
      this.currentToken = token;
      await setItem(key, token);
    }
  }

  async clearToken(apiUrl: string): Promise<void> {
    const key = this.getKey(apiUrl);
    this.currentToken = null;
    await setItem(key, '');
  }
}

export const csrfManager = new CSRFTokenManager();
