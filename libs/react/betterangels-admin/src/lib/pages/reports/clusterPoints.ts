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
 * A previous version of this file binned points into **screen-space cells** at the current zoom.
 * That is the approach an earlier iteration of this feature already rejected, in as many words:
 * "the grid is anchored to the viewport, so every zoom step — and every pan — re-partitions the
 * whole dataset from scratch. A cluster's count would jump for no geographic reason, and zooming
 * in did not subdivide a cluster, it replaced it." Rebuilding it that way reintroduced exactly
 * that bug; the tests here only covered a fixed zoom, which is why they passed.
 *
 * `supercluster` is a root dependency and is what the Expo map's `MapClusterManager` uses, at
 * the same radius, so the two maps in the product cluster at the same scale.
 */

import Supercluster from 'supercluster';

export type ClusterPoint = { latitude: number; longitude: number };
export type Cluster = { latitude: number; longitude: number; count: number };

/** Where clustering stops: above this every interaction draws alone. */
export const MAX_CLUSTER_ZOOM = 19;

/**
 * Cluster radius in pixels, matching the Expo map's `MapClusterManager` default.
 *
 * Deliberately the same number: two maps in one product that cluster at different scales look
 * like they disagree about the data.
 */
export const CLUSTER_RADIUS_PX = 50;

/**
 * A cluster of two, drawn as a bubble labelled "2", reads as data where it is really two
 * interactions that happened to land within the merge radius. Three is where a bubble starts
 * saying something, so supercluster leaves pairs as separate points.
 */
const MIN_CLUSTER_POINTS = 3;

/** `supercluster` wants `[westLng, southLat, eastLng, northLat]`; this is the whole world. */
const WORLD_BBOX: [number, number, number, number] = [-180, -85, 180, 85];

type PointProps = { id: number };
type ClusterProps = { id: number };

export type ClusterIndex = Supercluster<ClusterProps, PointProps>;

/**
 * Build the clustering tree. The property of the **data**, so it belongs in a memo keyed on the
 * points — never in the per-zoom path. Measured in the previous implementation at ~25 ms for
 * 5,000 points.
 */
export function buildClusterIndex(points: ClusterPoint[]): ClusterIndex {
  const index = new Supercluster<ClusterProps, PointProps>({
    radius: CLUSTER_RADIUS_PX,
    maxZoom: MAX_CLUSTER_ZOOM,
    // Set explicitly rather than left to the default, so the intent is reviewable.
    minZoom: 0,
    minPoints: MIN_CLUSTER_POINTS,
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
 * Sub-millisecond, so it is recomputed on every zoom rather than cached. Returns every cluster
 * in the world box, not only the visible ones — supercluster's own tree decides what merges, and
 * narrowing the query to the viewport is what would make the set depend on where you are looking.
 */
export function clustersForZoom(index: ClusterIndex, zoom: number): Cluster[] {
  return index.getClusters(WORLD_BBOX, Math.round(zoom)).map((feature) => {
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
