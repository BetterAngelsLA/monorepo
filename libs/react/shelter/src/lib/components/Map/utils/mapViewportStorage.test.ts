import { SESSION_STORAGE_MAP_VIEWPORT } from '../../../constants';
import {
  consumeSavedMapViewport,
  mapViewportFromMap,
  peekSavedMapViewport,
  saveMapViewport,
  TMapViewport,
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

const VIEWPORT: TMapViewport = {
  center: { latitude: 34.04499, longitude: -118.251601 },
  zoom: 13,
};

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    configurable: true,
  });
});

describe('mapViewportFromMap', () => {
  it('reads the exact center + zoom from a map instance', () => {
    const viewport = mapViewportFromMap({
      getCenter: () => ({ lat: () => 34.097262, lng: () => -118.361874 }),
      getZoom: () => 12,
    });

    expect(viewport).toEqual({
      center: { latitude: 34.097262, longitude: -118.361874 },
      zoom: 12,
    });
  });

  it('returns null when the map has no center', () => {
    expect(
      mapViewportFromMap({ getCenter: () => null, getZoom: () => 12 })
    ).toBeNull();
  });

  it('returns null when the zoom is not available', () => {
    expect(
      mapViewportFromMap({
        getCenter: () => ({ lat: () => 34.1, lng: () => -118.3 }),
        getZoom: () => undefined,
      })
    ).toBeNull();
  });
});

describe('saveMapViewport', () => {
  it('persists the exact center + zoom to session storage', () => {
    saveMapViewport(VIEWPORT);

    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBe(
      JSON.stringify(VIEWPORT)
    );
  });

  it('does not throw when storage is unavailable', () => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: undefined,
      configurable: true,
    });

    expect(() => saveMapViewport(VIEWPORT)).not.toThrow();
  });
});

describe('peekSavedMapViewport', () => {
  it('returns the saved viewport without consuming it', () => {
    saveMapViewport(VIEWPORT);

    expect(peekSavedMapViewport()).toEqual(VIEWPORT);
    // Value is still stored for the consuming call.
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBe(
      JSON.stringify(VIEWPORT)
    );
  });

  it('returns null when nothing is saved or the value is malformed', () => {
    expect(peekSavedMapViewport()).toBeNull();

    sessionStorage.setItem(SESSION_STORAGE_MAP_VIEWPORT, '{not valid json');
    expect(peekSavedMapViewport()).toBeNull();
  });
});

describe('consumeSavedMapViewport', () => {
  it('returns the saved viewport and removes the stored value (single use)', () => {
    saveMapViewport(VIEWPORT);

    expect(consumeSavedMapViewport()).toEqual(VIEWPORT);
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBeNull();
    expect(consumeSavedMapViewport()).toBeNull();
  });

  it('returns null when nothing is saved', () => {
    expect(consumeSavedMapViewport()).toBeNull();
  });

  it('returns null and clears the entry when the value is malformed', () => {
    sessionStorage.setItem(SESSION_STORAGE_MAP_VIEWPORT, '{not valid json');

    expect(consumeSavedMapViewport()).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBeNull();
  });
});
