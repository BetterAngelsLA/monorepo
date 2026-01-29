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

const initializeStorage =
  async (): Promise<PersistentSynchronousStorageApi> => {
    let key = await SecureStore.getItemAsync(
      NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE
    );
    if (!key) {
      key = Crypto.randomUUID();
      await SecureStore.setItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE, key);
    }
    return createPersistentSynchronousStorage({
      scopeId: AUTH_STORAGE_SCOPE_ID,
      encryptionKey: key,
    });
  };

// Extend global to store singleton across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __authStorage: AuthStorage | undefined;
  // eslint-disable-next-line no-var
  var __authStorageInstance: PersistentSynchronousStorageApi | undefined;
  // eslint-disable-next-line no-var
  var __authStorageInitPromise:
    | Promise<PersistentSynchronousStorageApi>
    | undefined;
}

// Initialize at module load - app waits for this in _layout.tsx
if (!global.__authStorageInitPromise) {
  global.__authStorageInitPromise = initializeStorage().then((storage) => {
    global.__authStorageInstance = storage;
    return storage;
  });
}

class AuthStorage {
  private static readonly STORAGE_KEY = 'cookies';

  private get storage(): PersistentSynchronousStorageApi {
    // Guaranteed ready after ensureReady() called by app or interceptor
    return global.__authStorageInstance!;
  }

  /**
   * Wait for storage initialization - called by app at startup
   */
  async ensureReady(): Promise<void> {
    if (!global.__authStorageInstance) {
      await global.__authStorageInitPromise;
      // After waiting, if still not set, reinitialize (hot reload edge case)
      if (!global.__authStorageInstance) {
        global.__authStorageInitPromise = initializeStorage().then((storage) => {
          global.__authStorageInstance = storage;
          return storage;
        });
        await global.__authStorageInitPromise;
      }
    }
  }

  getCookieValue(name: string): string | null {
    const jar = this.storage.get<CookieJar>(AuthStorage.STORAGE_KEY);
    return jar?.[name] ?? null;
  }

  clearCookies(): void {
    this.storage.set(AuthStorage.STORAGE_KEY, {});
  }

  /**
   * Get all cookies for request headers
   * Filters out client-only cookies (HMIS cookies not sent to backend)
   */
  getCookiesForRequest(): {
    cookieHeader: string | null;
    csrfToken: string | null;
    hmisToken: string | null;
  } {
    const jar = this.storage.get<CookieJar>(AuthStorage.STORAGE_KEY);
    if (!jar || Object.keys(jar).length === 0) {
      return { cookieHeader: null, csrfToken: null, hmisToken: null };
    }

    // Filter out client-only cookies - only send Django cookies to backend
    const clientOnlyCookies: readonly string[] = CLIENT_ONLY_COOKIES;
    const backendCookies = Object.entries(jar)
      .filter(([name]) => !clientOnlyCookies.includes(name))
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
   */
  updateFromSetCookieHeaders(headers: {
    get?: (key: string) => string | null;
    getSetCookie?: () => string[] | null | undefined;
  }): void {
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
      this.storage.clearAll();
      await SecureStore.deleteItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE);
    } catch {
      // Silently handle errors
    } finally {
      // Clear globals to force reinitialization
      global.__authStorage = undefined;
      global.__authStorageInstance = undefined;
      global.__authStorageInitPromise = undefined;
    }
  }
}

// Singleton across hot reloads
if (!global.__authStorage) {
  global.__authStorage = new AuthStorage();
}

export const authStorage = global.__authStorage;
