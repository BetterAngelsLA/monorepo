import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { parse as parseSetCookie, splitCookiesString } from 'set-cookie-parser';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import type { PersistentSynchronousStorageApi } from '../storage/types';
import {
  AUTH_STORAGE_SCOPE_ID,
  CLIENT_ONLY_COOKIES,
  CSRF_COOKIE_NAME,
  HMIS_AUTH_COOKIE_NAME,
  NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE,
} from './constants';

type CookieJar = Record<string, string>;

class AuthStorage {
  private storage: PersistentSynchronousStorageApi | null = null;
  private static readonly STORAGE_KEY = 'cookies';

  constructor() {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    let key = await SecureStore.getItemAsync(
      NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE
    );
    if (!key) {
      key = Crypto.randomUUID();
      await SecureStore.setItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE, key);
    }
    this.storage = createPersistentSynchronousStorage({
      scopeId: AUTH_STORAGE_SCOPE_ID,
      encryptionKey: key,
    });
  }

  /**
   * Get a cookie value by name
   */
  getCookieValue(name: string): string | null {
    const jar = this.storage?.get<CookieJar>(AuthStorage.STORAGE_KEY);
    return jar?.[name] ?? null;
  }

  /**
   * Clear all cookies - call before login to ensure clean state
   */
  clearCookies(): void {
    if (this.storage) {
      this.storage.set(AuthStorage.STORAGE_KEY, {});
    }
  }

  /**
   * Get all cookies for request headers
   * Filters out client-only cookies (HMIS cookies that should not be sent to backend)
   */
  getCookiesForRequest(): {
    cookieHeader: string | null;
    csrfToken: string | null;
    hmisToken: string | null;
  } {
    const jar = this.storage?.get<CookieJar>(AuthStorage.STORAGE_KEY);
    if (!jar || Object.keys(jar).length === 0) {
      return { cookieHeader: null, csrfToken: null, hmisToken: null };
    }

    // Filter out client-only cookies - only send Django cookies to backend
    const backendCookies = Object.entries(jar)
      .filter(([name]) => !CLIENT_ONLY_COOKIES.includes(name as any))
      .map(([name, value]) => `${name}=${value}`);

    return {
      cookieHeader:
        backendCookies.length > 0 ? backendCookies.join('; ') : null,
      csrfToken: jar[CSRF_COOKIE_NAME] ?? null,
      hmisToken: jar[HMIS_AUTH_COOKIE_NAME] ?? null,
    };
  }

  /**
   * Extract and store cookies from Set-Cookie headers
   * Overwrites existing cookies with same name
   */
  updateFromSetCookieHeaders(headers: {
    get?: (key: string) => string | null;
    getSetCookie?: () => string[] | null | undefined;
  }): void {
    if (!this.storage) return;

    const raw = headers.getSetCookie?.() ?? headers.get?.('set-cookie');
    if (!raw) return;

    const values = Array.isArray(raw) ? raw : splitCookiesString(raw);
    const parsed = parseSetCookie(values, { map: true });

    const jar = this.storage.get<CookieJar>(AuthStorage.STORAGE_KEY) ?? {};
    for (const [name, cookie] of Object.entries(parsed)) {
      if (cookie?.value) {
        jar[name] = cookie.value;
      }
    }

    this.storage.set(AuthStorage.STORAGE_KEY, jar);
  }

  /**
   * Check if HMIS auth_token is expired
   */
  isHmisTokenExpired(): boolean {
    const token = this.getCookieValue(HMIS_AUTH_COOKIE_NAME);
    if (!token) {
      return true;
    }

    try {
      const { exp } = jwtDecode<{ exp?: number }>(token);
      return !exp || exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  async clearAllCredentials(): Promise<void> {
    try {
      this.storage?.clearAll();
      await SecureStore.deleteItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE);
    } catch (error) {
      __DEV__ && console.warn('[AuthStorage] Clear failed:', error);
    } finally {
      this.storage = null;
      this.initStorage();
    }
  }

  reset(): void {
    this.storage = null;
    this.initStorage();
  }
}

export const authStorage = new AuthStorage();
