import { beforeEach, describe, expect, it, vi } from 'vitest';
import { symmetricBoundsAroundPinCentroid } from './symmetricBoundsAroundPinCentroid';

class FakeLatLngBounds {
  constructor(public sw: { lat: number; lng: number }, public ne: { lat: number; lng: number }) {}
}

beforeEach(() => {
  vi.stubGlobal('google', { maps: { LatLngBounds: FakeLatLngBounds } });
});

describe('symmetricBoundsAroundPinCentroid', () => {
  it('centers the bounds on the centroid of the pins and contains every pin', () => {
    const bounds = symmetricBoundsAroundPinCentroid([
      { latitude: 34.0, longitude: -118.5 },
      { latitude: 34.1, longitude: -118.4 },
      { latitude: 34.05, longitude: -118.45 },
    ]) as unknown as FakeLatLngBounds;

    // Centroid is (34.05, -118.45); the widest pins are ±0.05 in both axes,
    // which exceeds the ~0.0145 min padding, so the half-extent is 0.05.
    expect(bounds.sw.lat).toBeCloseTo(34.0, 5);
    expect(bounds.sw.lng).toBeCloseTo(-118.5, 5);
    expect(bounds.ne.lat).toBeCloseTo(34.1, 5);
    expect(bounds.ne.lng).toBeCloseTo(-118.4, 5);
  });

  it('applies a minimum padding radius when the pins are tightly clustered', () => {
    const bounds = symmetricBoundsAroundPinCentroid([
      { latitude: 34.05, longitude: -118.45 },
      { latitude: 34.05, longitude: -118.45 },
    ]) as unknown as FakeLatLngBounds;

    expect(bounds.sw.lat).toBeCloseTo(34.03554, 4);
    expect(bounds.sw.lng).toBeCloseTo(-118.46745, 4);
    expect(bounds.ne.lat).toBeCloseTo(34.06446, 4);
    expect(bounds.ne.lng).toBeCloseTo(-118.43255, 4);
  });
});
