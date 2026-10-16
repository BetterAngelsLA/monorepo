/**
 * Clustering for the map's "Clusters" view.
 *
 * The tree comes from **`supercluster`**, built once from the data in Web Mercator space, and
 * queried per zoom. That structure is the point:
 *
 * - A cluster keeps its identity and its count as the reader zooms, and zooming in *subdivides*
 *   it rather than replacing it with an unrelated set.
 * - Because the tree is anchored to the geography and not to the viewport, panning cannot
 *   re-partition the data or make a count jump.
 *
 * A screen-space grid fails both properties: its cells are anchored to the viewport, so every
 * zoom step — and every pan — re-partitions the whole dataset from scratch, a cluster's count
 * jumps for no geographic reason, and zooming in replaces a cluster instead of subdividing it.
 * Anchoring the tree to the geography is what avoids that.
 *
 * `supercluster` is a root dependency and is what the Expo map's `MapClusterManager` uses, but
 * only the radius is deliberately shared (`CLUSTER_RADIUS_PX`, 50 px). The rest of the options
 * differ, so the two maps do **not** cluster identically: `MapClusterManager` passes
 * `extent: 256` where this file takes supercluster's default 512, stops clustering at
 * `maxZoom: 20` where `MAX_CLUSTER_ZOOM` is 19, and leaves `minPoints` at its default 2 where
 * this file asks for 3.
 */

import Supercluster from 'supercluster';
import type { HeatPoint } from './heatmapMath';

export type Cluster = { latitude: number; longitude: number; count: number };

/** Where clustering stops: above this every interaction draws alone. */
export const MAX_CLUSTER_ZOOM = 19;

/**
 * Cluster radius in pixels, matching the Expo map's `MapClusterManager` default.
 *
 * Deliberately the same number — it is the one option the two share, so a bubble covers a
 * comparable share of the map in both. The other options differ (see the file header), so this
 * is the only axis on which the two maps are meant to agree.
 */
export const CLUSTER_RADIUS_PX = 50;

/** `supercluster` wants `[westLng, southLat, eastLng, northLat]`. */
export type BBox = [number, number, number, number]; // west, south, east, north

/** The whole world, for callers that have no viewport yet. */
const WORLD_BBOX: BBox = [-180, -85, 180, 85];

/**
 * `Supercluster<P, C>`: **P** is a point's properties, **C** a cluster's. Each point carries its
 * index into the original array; `cluster_id`/`point_count` are added by the library.
 */
type PointProps = { id: number };
type ClusterProps = { id: number };

export type ClusterIndex = Supercluster<PointProps, ClusterProps>;

/**
 * Build the clustering tree. The property of the **data**, so it belongs in a memo keyed on the
 * points — never in the per-zoom path.
 */
export function buildClusterIndex(points: HeatPoint[]): ClusterIndex {
  const index = new Supercluster<PointProps, ClusterProps>({
    radius: CLUSTER_RADIUS_PX,
    maxZoom: MAX_CLUSTER_ZOOM,
    // Set explicitly rather than left to the default, so the intent is reviewable.
    minZoom: 0,
    // A cluster of two, drawn as a bubble labelled "2", reads as data where it is really two
    // interactions that happened to land within the merge radius. Three is where a bubble starts
    // saying something, so pairs stay separate points — supercluster's default is 2.
    minPoints: 3,
  });
  index.load(
    points.map((point, id) => ({
      type: 'Feature' as const,
      properties: { id },
      geometry: {
        type: 'Point' as const,
        coordinates: [point.longitude, point.latitude],
      },
    })),
  );
  return index;
}

/**
 * The bubbles to draw at `zoom`.
 *
 * Sub-millisecond, so it is recomputed on every zoom rather than cached.
 *
 * Pass the viewport in `bounds` whenever one is available. The tree, the positions and the
 * counts are all fixed when the index is built, so the bbox only decides *which* of them come
 * back: narrowing the query cannot change a count or re-partition anything. What it does change
 * is how much is materialised — above `MAX_CLUSTER_ZOOM` every interaction is returned as its
 * own feature, so a whole-world query builds one object per point on every zoom tick even
 * though the viewport holds a small fraction of them. `bounds === null` asks for the whole
 * world, for a caller that has no viewport yet.
 */
export function clustersForZoom(
  index: ClusterIndex,
  zoom: number,
  bounds: BBox | null = null,
): Cluster[] {
  return index
    .getClusters(bounds ?? WORLD_BBOX, Math.round(zoom))
    .map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const properties = feature.properties as {
        cluster?: boolean;
        point_count?: number;
      };
      return {
        latitude,
        longitude,
        count: properties.cluster ? (properties.point_count ?? 1) : 1,
      };
    });
}

/**
 * Bubble radius in pixels, from the number of interactions it stands for.
 *
 * Square root, so the bubble's *area* tracks the count — a linear radius makes a busy bubble
 * swallow the map. Clamped at both ends: a lone interaction still needs to be visible, and one
 * bin must not cover the viewport.
 */
export function clusterRadius(count: number): number {
  return Math.min(38, 7 + Math.sqrt(Math.max(1, count)) * 2.2);
}
