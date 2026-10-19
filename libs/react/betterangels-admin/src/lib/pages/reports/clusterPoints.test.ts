import { describe, expect, it } from 'vitest';
import {
  buildClusterIndex,
  clustersForZoom,
  MAX_CLUSTER_ZOOM,
  type BBox,
  type Cluster,
} from './clusterPoints';

/** A deterministic LA-shaped set: a dense downtown core plus a thin county-wide spread. */
function makePoints(n: number) {
  let seed = 7;
  const rnd = () =>
    (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
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

/**
 * A fourth of the core in each direction — small enough that at high zoom it holds a small
 * fraction of the dataset, which is what makes the whole-world-vs-viewport distinction visible.
 */
const VIEW: BBox = [-118.26, 34.04, -118.24, 34.06];

function inside(point: Cluster, [west, south, east, north]: BBox): boolean {
  return (
    point.longitude >= west &&
    point.longitude <= east &&
    point.latitude >= south &&
    point.latitude <= north
  );
}

const key = (cluster: Cluster) => `${cluster.longitude},${cluster.latitude}`;

describe('clustersForZoom', () => {
  it('accounts for every point at every zoom', () => {
    // The property that matters most: clustering is a regrouping, never a sample. A cluster set
    // whose counts do not sum to the dataset has silently dropped or double-counted rows.
    for (const zoom of ZOOMS) {
      const total = clustersForZoom(INDEX, zoom).reduce(
        (n, c) => n + c.count,
        0,
      );
      expect(total, `zoom ${zoom}`).toBe(POINTS.length);
    }
  });

  it('subdivides as you zoom in, rather than replacing the set', () => {
    // With a tree built from the data, finer zooms can only ever split what was there — so the
    // number of marks grows monotonically.
    const counts = ZOOMS.map((zoom) => clustersForZoom(INDEX, zoom).length);
    for (let i = 1; i < counts.length; i++) {
      expect(
        counts[i],
        `zoom ${ZOOMS[i]} vs ${ZOOMS[i - 1]}`,
      ).toBeGreaterThanOrEqual(counts[i - 1]);
    }
    expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
  });

  it('places each cluster where its points are, with the axes the right way round', () => {
    // The dataset spans roughly lat 33.75-34.35, lng -118.65 to -117.85. A swapped latitude and
    // longitude would put every cluster outside this box.
    for (const zoom of ZOOMS) {
      for (const cluster of clustersForZoom(INDEX, zoom)) {
        expect(cluster.latitude, `zoom ${zoom}`).toBeGreaterThan(33.4);
        expect(cluster.latitude, `zoom ${zoom}`).toBeLessThan(34.7);
        expect(cluster.longitude, `zoom ${zoom}`).toBeGreaterThan(-119.1);
        expect(cluster.longitude, `zoom ${zoom}`).toBeLessThan(-117.4);
      }
    }
  });

  it('never draws a bubble for fewer than three points', () => {
    // `minPoints: 3`. A "2" bubble is exactly the mark that reads as data where it is not.
    const clustered = ZOOMS.flatMap((zoom) =>
      clustersForZoom(INDEX, zoom),
    ).filter((cluster) => cluster.count > 1);
    expect(clustered.length).toBeGreaterThan(0);
    expect(
      Math.min(...clustered.map((cluster) => cluster.count)),
    ).toBeGreaterThanOrEqual(3);
  });

  it('handles an empty dataset without throwing', () => {
    const empty = buildClusterIndex([]);
    expect(clustersForZoom(empty, 10)).toEqual([]);
    expect(clustersForZoom(empty, 10, VIEW)).toEqual([]);
  });
});

describe('clustersForZoom with viewport bounds', () => {
  it('returns the viewport query as a subset of the whole-world query, counts unchanged', () => {
    // The bbox only filters which precomputed clusters come back: the tree, the positions and
    // the counts are all fixed when the index is built, so a count cannot depend on the
    // viewport. A viewport-anchored grid fails this — the same cluster reports a different
    // count depending on where the map happens to be.
    for (const zoom of ZOOMS) {
      const world = clustersForZoom(INDEX, zoom);
      const view = clustersForZoom(INDEX, zoom, VIEW);
      const worldByKey = new Map(
        world.map((cluster) => [key(cluster), cluster]),
      );

      expect(view.length, `zoom ${zoom}`).toBeGreaterThan(0);
      for (const cluster of view) {
        expect(inside(cluster, VIEW), `${key(cluster)} at zoom ${zoom}`).toBe(
          true,
        );
        const match = worldByKey.get(key(cluster));
        expect(match, `${key(cluster)} at zoom ${zoom}`).toBeDefined();
        expect(match?.count, `${key(cluster)} at zoom ${zoom}`).toBe(
          cluster.count,
        );
      }

      // The viewport set is exactly the whole-world set filtered to the box — same members,
      // same counts, nothing re-partitioned.
      expect([...view].map(key).sort()).toEqual(
        world
          .filter((cluster) => inside(cluster, VIEW))
          .map(key)
          .sort(),
      );
      expect(view.reduce((n, c) => n + c.count, 0)).toBeLessThan(POINTS.length);
    }
  });

  it('does not materialise the whole dataset for a viewport query above MAX_CLUSTER_ZOOM', () => {
    // Above `MAX_CLUSTER_ZOOM` supercluster reports one feature per interaction, so a
    // whole-world query builds an object per point on every zoom tick. Supplying the viewport
    // must restrict the returned set — a whole-world `getClusters` call here would return all
    // 1200 and fail this test — while the counts of what it does return are untouched.
    const zoom = MAX_CLUSTER_ZOOM + 1;
    const world = clustersForZoom(INDEX, zoom);
    const view = clustersForZoom(INDEX, zoom, VIEW);

    expect(world).toHaveLength(POINTS.length);
    expect(view.length).toBeGreaterThan(0);
    expect(view.length).toBeLessThan(world.length / 4);
    expect(view.every((cluster) => inside(cluster, VIEW))).toBe(true);
    expect(view.reduce((n, c) => n + c.count, 0)).toBe(
      world
        .filter((cluster) => inside(cluster, VIEW))
        .reduce((n, c) => n + c.count, 0),
    );
  });
});
