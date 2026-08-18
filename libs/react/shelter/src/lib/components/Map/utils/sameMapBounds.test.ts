import { sameMapBounds } from './sameMapBounds';

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
    expect(sameMapBounds(BOUNDS, { ...BOUNDS, eastLng: -118.2000001 })).toBe(
      false,
    );
    expect(sameMapBounds(BOUNDS, { ...BOUNDS, northLat: 34.1000001 })).toBe(
      false,
    );
  });

  it('returns false when either side is undefined', () => {
    expect(sameMapBounds(undefined, BOUNDS)).toBe(false);
    expect(sameMapBounds(BOUNDS, undefined)).toBe(false);
    expect(sameMapBounds(undefined, undefined)).toBe(false);
  });
});
