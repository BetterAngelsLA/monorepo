import { describe, expect, it } from 'vitest';
import { clustersToBinary, pointsToBinary } from './deckData';

describe('pointsToBinary', () => {
  it('packs longitude then latitude, as XY', () => {
    // The order matters and is silent when wrong: deck reads x, y from the buffer, and a
    // lat/lon swap puts every point in the ocean with no error anywhere.
    const binary = pointsToBinary([
      { latitude: 34.05, longitude: -118.25 },
      { latitude: 34.06, longitude: -118.24 },
    ]);
    expect(binary.length).toBe(2);
    expect(binary.attributes.getPosition.size).toBe(2);
    const packed = Array.from(binary.attributes.getPosition.value);
    // `toBeCloseTo`, not equality: this is a Float32Array, so 34.05 comes back as
    // 34.04999923706055. See the precision note in `deckData.ts`.
    [-118.25, 34.05, -118.24, 34.06].forEach((expected, index) => {
      expect(packed[index]).toBeCloseTo(expected, 5);
    });
    expect(binary.attributes.getPosition.value).toBeInstanceOf(Float32Array);
  });

  it('handles an empty set without a zero-length buffer error', () => {
    const binary = pointsToBinary([]);
    expect(binary.length).toBe(0);
    expect(binary.attributes.getPosition.value.length).toBe(0);
  });
});

describe('clustersToBinary', () => {
  it('bakes the radius from the count', () => {
    // Radius is a pure function of count, so it is computed once here rather than by an
    // accessor deck would run per cluster on every update.
    const binary = clustersToBinary(
      [
        { latitude: 34.05, longitude: -118.25, count: 1 },
        { latitude: 34.06, longitude: -118.24, count: 100 },
      ],
      (count) => count,
    );
    expect(binary.length).toBe(2);
    expect(Array.from(binary.attributes.getRadius.value)).toEqual([1, 100]);
    const packed = Array.from(binary.attributes.getPosition.value);
    [-118.25, 34.05, -118.24, 34.06].forEach((expected, index) => {
      expect(packed[index]).toBeCloseTo(expected, 5);
    });
  });
});
