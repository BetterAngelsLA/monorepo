import { StorageAdapter } from './types';

/** ``StorageAdapter`` backed by the browser ``localStorage`` API. */
export const localStorageAdapter: StorageAdapter = {
  getItem(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error('[localStorageAdapter] Failed to setItem:', err);
    }
  },
};
