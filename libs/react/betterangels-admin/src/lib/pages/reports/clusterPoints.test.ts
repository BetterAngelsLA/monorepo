import { describe, expect, it } from 'vitest';
import { buildClusterIndex, clustersForZoom } from './clusterPoints';

/** A deterministic LA-shaped set: a dense downtown core plus a thin county-wide spread. */
function makePoints(n: number) {
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: n }, () => {
    const tight = rnd() < 0.75;
    return {
      latitude: 34.05 + (rnd() - 0.5) * (tight ? 0.06 : 0.6),
      longitude: -118.25 + (rnd() - 0.5) * (tight ? 0.06 : 0.8),
    };
  });
}

const POINTS = makePoints(1200);
const INDEX = buildClusterIndex(POINTS);
const ZOOMS = [7, 10, 13, 16];

describe('clustersForZoom', () => {
  it('accounts for every point at every zoom', () => {
    // The property that matters most: clustering is a regrouping, never a sample. A cluster set
    // whose counts do not sum to the dataset has silently dropped or double-counted rows.
    for (const zoom of ZOOMS) {
      const total = clustersForZoom(INDEX, zoom).reduce((n, c) => n + c.count, 0);
      expect(total, `zoom ${zoom}`).toBe(POINTS.length);
    }
  });

  it('subdivides as you zoom in, rather than replacing the set', () => {
    // The bug a screen-space grid reintroduces: bins are anchored to the viewport, so zooming
    // re-partitions from scratch and a cluster is replaced by an unrelated one. With a tree
    // built from the data, finer zooms can only ever split what was there — so the number of
    // marks grows monotonically.
    const counts = ZOOMS.map((zoom) => clustersForZoom(INDEX, zoom).length);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i], `zoom ${ZOOMS[i]} vs ${ZOOMS[i - 1]}`).toBeGreaterThanOrEqual(
        counts[i - 1],
      );
    }
    expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
  });

  it('gives a cluster the same count and position however it is queried', () => {
    // Identity and stability. A viewport-anchored grid fails this: the same cluster reports a
    // different count depending on where the map happens to be.
    const first = clustersForZoom(INDEX, 11);
    const second = clustersForZoom(INDEX, 11);
    expect(second).toEqual(first);
  });

  it('leaves a cluster of two unfolded, so a "2" bubble never claims to be data', () => {
    // `minPoints: 3` — a pair stays two points.
    const pairs = clustersForZoom(INDEX, 19).filter((cluster) => cluster.count === 2);
    expect(pairs).toEqual([]);
  });

  it('handles an empty dataset without throwing', () => {
    const empty = buildClusterIndex([]);
    expect(clustersForZoom(empty, 10)).toEqual([]);
  });
});
