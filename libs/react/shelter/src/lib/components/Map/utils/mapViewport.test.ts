import { mapViewportFromMap } from './mapViewport';

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
      mapViewportFromMap({ getCenter: () => null, getZoom: () => 12 }),
    ).toBeNull();
  });

  it('returns null when the zoom is not available', () => {
    expect(
      mapViewportFromMap({
        getCenter: () => ({ lat: () => 34.1, lng: () => -118.3 }),
        getZoom: () => undefined,
      }),
    ).toBeNull();
  });
});
