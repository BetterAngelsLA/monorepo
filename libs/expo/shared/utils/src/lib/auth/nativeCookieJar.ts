import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { parse as parseSetCookie, splitCookiesString } from 'set-cookie-parser';
import { createPersistentSynchronousStorage } from '../storage/createPersistentSynchronousStorage';
import type { PersistentSynchronousStorageApi } from '../storage/types';
import {
  CSRF_COOKIE_NAME,
  NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE,
  SESSION_COOKIE_NAME,
} from './constants';

const ALLOWED = [CSRF_COOKIE_NAME, SESSION_COOKIE_NAME];

type CookieJar = Record<string, string>;

let storage: PersistentSynchronousStorageApi | null = null;
let initPromise: Promise<PersistentSynchronousStorageApi> | null = null;

/**
 * Lazy initialization: Get or create encrypted MMKV storage.
 * First call is async (SecureStore), subsequent calls return cached instance.
 */
const getStorage = async (): Promise<PersistentSynchronousStorageApi> => {
  if (storage) return storage;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Get or create device-unique encryption key
      let key = await SecureStore.getItemAsync(
        NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE
      );
      if (!key) {
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        key = Array.from(randomBytes, (b) =>
          b.toString(16).padStart(2, '0')
        ).join('');
        await SecureStore.setItemAsync(
          NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE,
          key
        );
        if (__DEV__) console.log('[NativeCookieJar] Generated encryption key');
      }

      storage = createPersistentSynchronousStorage({
        scopeId: 'native-cookies',
        encryptionKey: key,
      });
      if (__DEV__)
        console.log('[NativeCookieJar] Initialized encrypted storage');
    } catch (error) {
      if (__DEV__)
        console.warn(
          '[NativeCookieJar] Init failed, using unencrypted:',
          error
        );
      storage = createPersistentSynchronousStorage({
        scopeId: 'native-cookies',
      });
    }

    if (!storage) throw new Error('[NativeCookieJar] Init failed');
    return storage;
  })();

  const result = await initPromise;
  initPromise = null;
  return result;
};

export const getCookieValue = async (
  envKey: string,
  name: string
): Promise<string | null> => {
  const storage = await getStorage();
  const jar = storage.get<CookieJar>(envKey);
  return jar?.[name] ?? null;
};

export const getCookiesForRequest = async (
  envKey: string
): Promise<{ cookieHeader: string | null; csrfToken: string | null }> => {
  const storage = await getStorage();
  const jar = storage.get<CookieJar>(envKey) ?? {};

  const cookieHeader =
    ALLOWED.filter((name) => jar[name])
      .map((name) => `${name}=${jar[name]}`)
      .join('; ') || null;

  return {
    cookieHeader,
    csrfToken: jar[CSRF_COOKIE_NAME] ?? null,
  };
};

export const updateFromSetCookieHeaders = async (
  envKey: string,
  headers: {
    get?: (key: string) => string | null;
    getSetCookie?: () => string[] | null | undefined;
  }
) => {
  const raw = headers.getSetCookie?.() ?? headers.get?.('set-cookie') ?? null;
  if (!raw) return;

  const values = Array.isArray(raw) ? raw : splitCookiesString(raw);
  if (!values.length) return;

  const parsed = parseSetCookie(values, { map: true });
  const storage = await getStorage();
  const jar = storage.get<CookieJar>(envKey) ?? {};

  for (const name of ALLOWED) {
    const cookie = parsed[name];
    if (cookie?.value) jar[name] = cookie.value;
  }

  storage.set(envKey, jar);
};

export const clearAll = async () => {
  storage = null;
  initPromise = null;

  try {
    await SecureStore.deleteItemAsync(NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE);
    if (__DEV__) console.log('[NativeCookieJar] Cleared all');
  } catch (error) {
    if (__DEV__) console.warn('[NativeCookieJar] Clear failed:', error);
  }
};

/**
 * Reset module state for testing.
 * @internal
 */
export const __reset = () => {
  storage = null;
  initPromise = null;
};
