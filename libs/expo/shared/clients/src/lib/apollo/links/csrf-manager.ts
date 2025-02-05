// libs/expo/shared/clients/src/lib/apollo/csrf-manager.ts
import { getItem, setItem } from '@monorepo/expo/shared/utils';
import { CSRF_COOKIE_NAME } from './constants';

class CSRFTokenManager {
  private currentToken: string | null = null;
  private inProgress: Promise<string | null> | null = null;
  private environment: 'production' | 'demo' = 'production';

  initialize(environment: 'production' | 'demo') {
    this.environment = environment;
    getItem(this.getStorageKey()).then((stored) => {
      this.currentToken = stored || null;
    });
  }

  private getStorageKey() {
    return `${CSRF_COOKIE_NAME}_${this.environment}`;
  }

  async getToken(apiUrl: string, customFetch = fetch): Promise<string | null> {
    if (this.currentToken) return this.currentToken;

    if (this.inProgress) return this.inProgress;

    this.inProgress = (async () => {
      try {
        const stored = await getItem(this.getStorageKey());
        if (stored) {
          this.currentToken = stored;
          return stored;
        }
        const response = await customFetch(apiUrl, { credentials: 'include' });
        const cookies = response.headers?.get('Set-Cookie') || '';
        const match = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
        const token = match ? match[1] : null;
        if (token) {
          this.currentToken = token;
          await setItem(this.getStorageKey(), token);
        }
        return token;
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return null;
      } finally {
        this.inProgress = null;
      }
    })();
    return this.inProgress;
  }

  async clearToken() {
    await setItem(this.getStorageKey(), '');
    this.currentToken = null;
  }

  setToken(token: string) {
    this.currentToken = token;
    setItem(this.getStorageKey(), token);
  }

  async updateTokenFromCookies(cookies: string) {
    const match = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
    if (match) {
      const newToken = match[1];
      if (newToken !== this.currentToken) {
        this.setToken(newToken);
      }
    }
  }
}

export const csrfManager = new CSRFTokenManager();
