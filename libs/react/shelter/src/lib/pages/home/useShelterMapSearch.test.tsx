/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  savedMapViewportAtom,
  shelterMapBoundsFilterAtom,
  shelterSearchTriggerAtom,
} from '../../atoms';
import { useShelterMapSearch } from './useShelterMapSearch';

type FakeMap = {
  getBounds: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
};

type FakeLatLngBounds = {
  toJSON: () => { west: number; north: number; east: number; south: number };
};

let mapMock: FakeMap;
let geolocationMock: ReturnType<typeof vi.fn>;

vi.mock('@vis.gl/react-google-maps', () => ({
  useMap: () => mapMock,
}));

function makeBounds(
  overrides: Partial<{ west: number; north: number; east: number; south: number }> = {}
): FakeLatLngBounds {
  const bounds = {
    west: -118.5,
    north: 34.2,
    east: -118.1,
    south: 34.0,
    ...overrides,
  };
  return { toJSON: () => bounds };
}

const SAVED_BOUNDS = {
  westLng: -118.5,
  northLat: 34.2,
  eastLng: -118.1,
  southLat: 34.0,
};

const LA_CENTER = { latitude: 34.04499, longitude: -118.251601 };

beforeEach(() => {
  getDefaultStore().set(shelterSearchTriggerAtom, 0);
  getDefaultStore().set(shelterMapBoundsFilterAtom, undefined);
  getDefaultStore().set(savedMapViewportAtom, null);
  mapMock = {
    getBounds: vi.fn().mockReturnValue(makeBounds()),
    fitBounds: vi.fn(),
  };
  geolocationMock = vi.fn();
  // jsdom has no geolocation by default; drop any opt-in stub from a prior test.
  if ('geolocation' in navigator) {
    delete (navigator as { geolocation?: unknown }).geolocation;
  }
});

describe('useShelterMapSearch', () => {
  it('falls back to the LA county center and searches the rendered bounds when geolocation is unavailable', () => {
    const { result } = renderHook(() => useShelterMapSearch());

    // Camera starts at the LA county center; the init effect sets the location
    // to the same point (no geolocation in jsdom), so the location effect finds
    // the camera already centered and fires the search immediately.
    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(1);
    expect(getDefaultStore().get(shelterMapBoundsFilterAtom)).toEqual(
      SAVED_BOUNDS
    );
    expect(result.current.camera).toEqual({ center: LA_CENTER, zoom: 13 });
  });

  it('centers on the geolocated position and fires the search when the map settles', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: geolocationMock },
      configurable: true,
    });
    geolocationMock.mockImplementation((success: (p: object) => void) =>
      success({ coords: { latitude: 34.1, longitude: -118.2 } })
    );

    const { result } = renderHook(() => useShelterMapSearch());

    // The geolocated position moves the camera away from the initial LA county
    // center, so the search waits for the map to settle (onMapIdle) with the
    // actual rendered bounds.
    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(0);

    act(() => {
      result.current.onMapIdle(SAVED_BOUNDS);
    });

    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(1);
    expect(getDefaultStore().get(shelterMapBoundsFilterAtom)).toEqual(
      SAVED_BOUNDS
    );
  });

  it('does not re-search on restore when the rendered bounds match the last search', () => {
    getDefaultStore().set(shelterMapBoundsFilterAtom, SAVED_BOUNDS);
    getDefaultStore().set(savedMapViewportAtom, {
      center: LA_CENTER,
      zoom: 13,
    });
    mapMock.getBounds.mockReturnValue(makeBounds()); // == SAVED_BOUNDS

    const { result } = renderHook(() => useShelterMapSearch());

    // The camera mounted at the saved viewport and the restored bounds equal
    // the last searched bounds, so no redundant search fires: the results are
    // already current (and the query would be an Apollo cache hit anyway).
    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(0);
    expect(getDefaultStore().get(shelterMapBoundsFilterAtom)).toEqual(
      SAVED_BOUNDS
    );
    expect(getDefaultStore().get(savedMapViewportAtom)).toBeNull();
    expect(result.current.camera).toEqual({ center: LA_CENTER, zoom: 13 });
  });

  it('re-searches on restore when the rendered bounds differ from the last search', () => {
    getDefaultStore().set(shelterMapBoundsFilterAtom, SAVED_BOUNDS);
    getDefaultStore().set(savedMapViewportAtom, {
      center: LA_CENTER,
      zoom: 13,
    });
    // e.g. the window was resized while on the detail page: same camera, but
    // the rendered bounds are genuinely different.
    mapMock.getBounds.mockReturnValue(makeBounds({ east: -118.2 }));

    renderHook(() => useShelterMapSearch());

    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(1);
    expect(getDefaultStore().get(shelterMapBoundsFilterAtom)).toEqual({
      ...SAVED_BOUNDS,
      eastLng: -118.2,
    });
  });

  it('fires a new search when the user searches the current map area', () => {
    const { result } = renderHook(() => useShelterMapSearch());
    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(1); // initial fallback search

    act(() => {
      result.current.onSearchMapArea(makeBounds({ west: -118.6 }));
    });

    expect(getDefaultStore().get(shelterSearchTriggerAtom)).toBe(2);
    expect(getDefaultStore().get(shelterMapBoundsFilterAtom)).toEqual({
      ...SAVED_BOUNDS,
      westLng: -118.6,
    });
  });
});
