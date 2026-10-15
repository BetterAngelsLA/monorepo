/**
 * Screen-space clustering for the map's "Clusters" view.
 *
 * Points are binned on a Web Mercator pixel grid at the current zoom, and each bin becomes
 * one bubble carrying the number of interactions inside it. The grid is in *pixels*, so a bin
 * covers the same amount of screen at every level: zooming in splits a bubble into the
 * bubbles underneath it, which is the behaviour the view's caption promises ("a numbered
 * bubble counts the interactions under it; zoom in to split it").
 *
 * Deliberately not `@googlemaps/markerclusterer`. That renders one DOM node per marker, and
 * with the map's point cap at 10,000 that is 10,000 nodes the browser has to lay out. This is
 * arithmetic over a typed array, and deck.gl draws the result on the GPU.
 */

export type ClusterPoint = { latitude: number; longitude: number };
export type Cluster = { latitude: number; longitude: number; count: number };

/** Web Mercator pixel space at a zoom, the projection the bins are cut in. */
function project(
  latitude: number,
  longitude: number,
  zoom: number,
): [number, number] {
  const worldPx = 256 * Math.pow(2, zoom);
  const x = ((longitude + 180) / 360) * worldPx;
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const sin = Math.sin((clamped * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldPx;
  return [x, y];
}

/**
 * Default bin edge, in pixels.
 *
 * Roughly the diameter of a bubble at its largest, so two bubbles that would overlap are
 * already the same bubble.
 */
export const CLUSTER_CELL_PX = 64;

export function clusterPoints(
  points: ClusterPoint[],
  zoom: number,
  cellPx: number = CLUSTER_CELL_PX,
): Cluster[] {
  if (points.length === 0) {
    return [];
  }
  const cell = Math.max(1, cellPx);
  const bins = new Map<string, { lat: number; lon: number; count: number }>();

  for (const point of points) {
    const [x, y] = project(point.latitude, point.longitude, zoom);
    const key = `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
    const bin = bins.get(key);
    if (bin) {
      // The mean of the members, so a bubble sits in the middle of what it stands for
      // rather than at whichever point happened to land first.
      bin.lat += point.latitude;
      bin.lon += point.longitude;
      bin.count += 1;
    } else {
      bins.set(key, { lat: point.latitude, lon: point.longitude, count: 1 });
    }
  }

  return [...bins.values()].map((bin) => ({
    latitude: bin.lat / bin.count,
    longitude: bin.lon / bin.count,
    count: bin.count,
  }));
}

/**
 * Bubble radius in pixels, from the number of interactions it stands for.
 *
 * Square root, so the bubble's *area* tracks the count — doubling the radius of a circle
 * quadruples the ink, and a linear radius makes a busy bubble swallow the map. Clamped at
 * both ends: a lone interaction still needs to be clickable, and one bin must not cover the
 * viewport.
 */
export function clusterRadius(count: number): number {
  return Math.min(38, 7 + Math.sqrt(Math.max(1, count)) * 2.2);
}
