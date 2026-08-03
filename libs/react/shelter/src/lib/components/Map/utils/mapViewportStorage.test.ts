import { SESSION_STORAGE_MAP_BOUNDS } from '../../../constants';
import {
  consumeSavedMapBounds,
  saveMapBounds,
} from './mapViewportStorage';

// This project's Jest environment is 'node', so provide an in-memory
// sessionStorage implementation for the duration of the tests.
const store = new Map<string, string>();

const sessionStorageMock: Storage = {
  get length() {
    return store.size;
  },
  clear: () => store.clear(),
  getItem: (key: string) => store.get(key) ?? null,
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  removeItem: (key: string) => void store.delete(key),
  setItem: (key: string, value: string) => void store.set(key, value),
};

const BOUNDS = {
  westLng: -118.5,
  northLat: 34.1,
  eastLng: -118.2,
  southLat: 33.9,
};

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    configurable: true,
  });
});

describe('saveMapBounds', () => {
  it('persists the map bounds to session storage', () => {
    saveMapBounds(BOUNDS);

    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_BOUNDS)).toBe(
      JSON.stringify(BOUNDS)
    );
  });

  it('does not throw when storage is unavailable', () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: undefined,
      configurable: true,
    });

    expect(() => saveMapBounds(BOUNDS)).not.toThrow();
  });
});

describe('consumeSavedMapBounds', () => {
  it('returns the saved bounds and removes the stored value (single use)', () => {
    saveMapBounds(BOUNDS);

    expect(consumeSavedMapBounds()).toEqual(BOUNDS);
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_BOUNDS)).toBeNull();
    expect(consumeSavedMapBounds()).toBeNull();
  });

  it('returns null when nothing is saved', () => {
    expect(consumeSavedMapBounds()).toBeNull();
  });

  it('returns null and clears the entry when the value is malformed', () => {
    sessionStorage.setItem(SESSION_STORAGE_MAP_BOUNDS, '{not valid json');

    expect(consumeSavedMapBounds()).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_BOUNDS)).toBeNull();
  });
});
