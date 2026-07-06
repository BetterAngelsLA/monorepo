import { StorageAdapter } from './types';

/** ``StorageAdapter`` backed by the browser ``localStorage`` API. */
export const localStorageAdapter: StorageAdapter = {
  getItem(key: string) {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // storage may be unavailable
    }
  },
};
