import { mapViewportFromMap, sameMapBounds } from './mapViewport';

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

describe('sameMapBounds', () => {
  const BOUNDS = {
    westLng: -118.5,
    northLat: 34.1,
    eastLng: -118.2,
    southLat: 34.0,
  };

  it('returns true for identical bounds', () => {
    expect(sameMapBounds(BOUNDS, { ...BOUNDS })).toBe(true);
  });

  it('returns false when any edge differs', () => {
    expect(
      sameMapBounds(BOUNDS, { ...BOUNDS, eastLng: -118.2000001 })
    ).toBe(false);
    expect(
      sameMapBounds(BOUNDS, { ...BOUNDS, northLat: 34.1000001 })
    ).toBe(false);
  });

  it('returns false when either side is undefined', () => {
    expect(sameMapBounds(undefined, BOUNDS)).toBe(false);
    expect(sameMapBounds(BOUNDS, undefined)).toBe(false);
    expect(sameMapBounds(undefined, undefined)).toBe(false);
  });
});
