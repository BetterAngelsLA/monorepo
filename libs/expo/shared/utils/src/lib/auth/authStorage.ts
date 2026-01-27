import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { parse as parseSetCookie, splitCookiesString } from 'set-cookie-parser';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import type { PersistentSynchronousStorageApi } from '../storage/types';
import {
  AUTH_STORAGE_SCOPE_ID,
  CSRF_COOKIE_NAME,
  HMIS_API_URL_KEY,
  HMIS_AUTH_TOKEN_KEY,
  NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE,
  SESSION_COOKIE_NAME,
} from './constants';

const ALLOWED_COOKIES = [CSRF_COOKIE_NAME, SESSION_COOKIE_NAME];
type CookieJar = Record<string, string>;

class AuthStorage {
  private storage: PersistentSynchronousStorageApi | null = null;

  constructor() {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      let key = await SecureStore.getItemAsync(
        NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE
      );
      if (!key) {
        key = Crypto.randomUUID();
        await SecureStore.setItemAsync(
          NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE,
          key
        );
      }
      this.storage = createPersistentSynchronousStorage({
        scopeId: AUTH_STORAGE_SCOPE_ID,
        encryptionKey: key,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn(
          '[AuthStorage] Encryption failed, using unencrypted:',
          error
        );
      }
      this.storage = createPersistentSynchronousStorage({
        scopeId: AUTH_STORAGE_SCOPE_ID,
      });
    }
  }

  getCookieValue(envKey: string, name: string): string | null {
    return this.storage?.get<CookieJar>(envKey)?.[name] ?? null;
  }

  getCookiesForRequest(envKey: string): {
    cookieHeader: string | null;
    csrfToken: string | null;
  } {
    const jar = this.storage?.get<CookieJar>(envKey) ?? {};
    const cookieHeader =
      ALLOWED_COOKIES.filter((name) => jar[name])
        .map((name) => `${name}=${jar[name]}`)
        .join('; ') || null;
    return { cookieHeader, csrfToken: jar[CSRF_COOKIE_NAME] ?? null };
  }

  updateFromSetCookieHeaders(
    envKey: string,
    headers: {
      get?: (key: string) => string | null;
      getSetCookie?: () => string[] | null | undefined;
    }
  ): void {
    if (!this.storage) {
      return;
    }

    const raw = headers.getSetCookie?.() ?? headers.get?.('set-cookie') ?? null;
    if (!raw) {
      return;
    }

    const values = Array.isArray(raw) ? raw : splitCookiesString(raw);
    if (!values.length) {
      return;
    }

    const parsed = parseSetCookie(values, { map: true });
    const jar = this.storage.get<CookieJar>(envKey) ?? {};

    for (const name of ALLOWED_COOKIES) {
      if (parsed[name]?.value) {
        jar[name] = parsed[name].value;
      }
    }
    this.storage.set(envKey, jar);
  }

  storeHmisAuthToken(token: string): void {
    this.storage?.set(HMIS_AUTH_TOKEN_KEY, token);
  }

  getHmisAuthToken(): string | null {
    return this.storage?.get<string>(HMIS_AUTH_TOKEN_KEY) ?? null;
  }

  storeHmisApiUrl(apiUrl: string): void {
    this.storage?.set(HMIS_API_URL_KEY, apiUrl);
  }

  getHmisApiUrl(): string | null {
    return this.storage?.get<string>(HMIS_API_URL_KEY) ?? null;
  }

  isHmisTokenExpired(): boolean {
    const token = this.getHmisAuthToken();
    if (!token) {
      return true;
    }

    try {
      const payload = jwtDecode<{ exp?: number }>(token);
      if (!payload.exp) {
        return true;
      }
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp < nowInSeconds;
    } catch {
      return true;
    }
  }

  async clearAllCredentials(): Promise<void> {
    try {
      this.storage?.clearAll();
      await SecureStore.deleteItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE);
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthStorage] Clear failed:', error);
      }
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
