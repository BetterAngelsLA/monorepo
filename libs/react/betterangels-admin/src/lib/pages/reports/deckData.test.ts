import { describe, expect, it } from 'vitest';
import { clustersToBinary } from './deckData';

const CLUSTERS = [
  { latitude: 34.05, longitude: -118.25, count: 1 },
  { latitude: 34.06, longitude: -118.24, count: 100 },
];

describe('clustersToBinary', () => {
  it('names the attributes and sizes deck.gl expects', () => {
    // A misspelled attribute name or a wrong `size` silently renders nothing, so pin both.
    const binary = clustersToBinary(CLUSTERS, (count) => count);
    expect(Object.keys(binary.attributes).sort()).toEqual([
      'getPosition',
      'getRadius',
    ]);
    expect(binary.attributes.getPosition.size).toBe(2);
    expect(binary.attributes.getRadius.size).toBe(1);
    expect(binary.attributes.getPosition.value).toBeInstanceOf(Float32Array);
    expect(binary.attributes.getRadius.value).toBeInstanceOf(Float32Array);
  });

  it('packs positions as interleaved [longitude, latitude]', () => {
    // deck.gl's `getPosition` reads x then y. A swapped pair draws the dataset off the coast of
    // Antarctica, so assert the actual values rather than the array's shape.
    const binary = clustersToBinary(CLUSTERS, (count) => count);
    const positions = Array.from(binary.attributes.getPosition.value);

    expect(positions).toHaveLength(CLUSTERS.length * 2);
    expect(positions[0]).toBeCloseTo(-118.25, 5); // longitude first
    expect(positions[1]).toBeCloseTo(34.05, 5); // latitude second
    expect(positions[2]).toBeCloseTo(-118.24, 5);
    expect(positions[3]).toBeCloseTo(34.06, 5);
  });

  it('bakes the radius from the count', () => {
    // Radius is a pure function of count, so it is computed once here rather than by an
    // accessor deck would run per cluster on every update.
    const binary = clustersToBinary(CLUSTERS, (count) => count * 2);
    expect(binary.length).toBe(2);
    expect(Array.from(binary.attributes.getRadius.value)).toEqual([2, 200]);
    expect(binary.attributes.getRadius.value).toHaveLength(CLUSTERS.length);
  });

  it('produces an empty buffer set for no clusters', () => {
    const binary = clustersToBinary([], (count) => count);
    expect(binary.length).toBe(0);
    expect(binary.attributes.getPosition.value).toHaveLength(0);
    expect(binary.attributes.getRadius.value).toHaveLength(0);
  });
});
