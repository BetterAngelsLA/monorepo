import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { parse as parseSetCookie, splitCookiesString } from 'set-cookie-parser';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import type { PersistentSynchronousStorageApi } from '../storage/types';
import {
  CSRF_COOKIE_NAME,
  HMIS_API_URL_KEY,
  HMIS_AUTH_TOKEN_KEY,
  NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE,
  SESSION_COOKIE_NAME,
} from './constants';

const ALLOWED_COOKIES = [CSRF_COOKIE_NAME, SESSION_COOKIE_NAME];
type CookieJar = Record<string, string>;

let storage: PersistentSynchronousStorageApi | null = null;
let initPromise: Promise<PersistentSynchronousStorageApi> | null = null;

const getStorage = async (): Promise<PersistentSynchronousStorageApi> => {
  if (storage) return storage;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      let key = await SecureStore.getItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE);
      if (!key) {
        const bytes = await Crypto.getRandomBytesAsync(32);
        key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        await SecureStore.setItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE, key);
      }
      storage = createPersistentSynchronousStorage({
        scopeId: 'auth-storage',
        encryptionKey: key,
      });
    } catch (error) {
      if (__DEV__) console.warn('[AuthStorage] Encryption failed, using unencrypted:', error);
      storage = createPersistentSynchronousStorage({ scopeId: 'auth-storage' });
    }
    if (!storage) throw new Error('[AuthStorage] Init failed');
    return storage;
  })();

  const result = await initPromise;
  initPromise = null;
  return result;
};

// Cookie management
export const getCookieValue = async (envKey: string, name: string): Promise<string | null> => {
  const storage = await getStorage();
  const jar = storage.get<CookieJar>(envKey) ?? {};
  return jar[name] ?? null;
};

export const getCookiesForRequest = async (
  envKey: string
): Promise<{ cookieHeader: string | null; csrfToken: string | null }> => {
  const storage = await getStorage();
  const jar = storage.get<CookieJar>(envKey) ?? {};
  const cookieHeader = ALLOWED_COOKIES.filter((name) => jar[name])
    .map((name) => `${name}=${jar[name]}`)
    .join('; ') || null;
  return { cookieHeader, csrfToken: jar[CSRF_COOKIE_NAME] ?? null };
};

export const updateFromSetCookieHeaders = async (
  envKey: string,
  headers: { get?: (key: string) => string | null; getSetCookie?: () => string[] | null | undefined }
) => {
  const raw = headers.getSetCookie?.() ?? headers.get?.('set-cookie') ?? null;
  if (!raw) return;

  const values = Array.isArray(raw) ? raw : splitCookiesString(raw);
  if (!values.length) return;

  const parsed = parseSetCookie(values, { map: true });
  const storage = await getStorage();
  const jar = storage.get<CookieJar>(envKey) ?? {};

  for (const name of ALLOWED_COOKIES) {
    if (parsed[name]?.value) jar[name] = parsed[name].value;
  }
  storage.set(envKey, jar);
};

// HMIS auth management
export const storeHmisAuthToken = async (token: string): Promise<void> => {
  const storage = await getStorage();
  storage.set(HMIS_AUTH_TOKEN_KEY, token);
};

export const getHmisAuthToken = async (): Promise<string | null> => {
  const storage = await getStorage();
  return storage.get<string>(HMIS_AUTH_TOKEN_KEY);
};

export const storeHmisApiUrl = async (apiUrl: string): Promise<void> => {
  const storage = await getStorage();
  storage.set(HMIS_API_URL_KEY, apiUrl);
};

export const getHmisApiUrl = async (): Promise<string | null> => {
  const storage = await getStorage();
  return storage.get<string>(HMIS_API_URL_KEY);
};

// Clear all auth data
export const clearAll = async () => {
  storage = null;
  initPromise = null;
  try {
    await SecureStore.deleteItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE);
  } catch (error) {
    if (__DEV__) console.warn('[AuthStorage] Clear failed:', error);
    throw error;
  }
};

export const __reset = () => {
  storage = null;
  initPromise = null;
};
