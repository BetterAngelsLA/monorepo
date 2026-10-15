import { describe, expect, it } from 'vitest';
import { clustersToBinary } from './deckData';

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
