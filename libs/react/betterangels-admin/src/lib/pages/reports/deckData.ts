/**
 * deck.gl binary attribute builders.
 *
 * deck.gl takes layer data either as an array of objects with accessor functions, or as
 * **binary attributes** — typed arrays plus a length. The array form runs the accessor once per
 * object per update, and every accessor here returns a fresh `[longitude, latitude]` tuple, so
 * the accessor form would allocate one tuple per point on every layer update. The binary form
 * allocates two typed arrays once and hands deck the buffer.
 *
 * See deck.gl's "Performance Optimization" / binary data section: the accessor form is for
 * convenience, and the binary form is what the layer actually consumes.
 *
 * **Positions become `float32`.** A `Float32Array` cannot hold 34.05 exactly — it stores
 * 34.04999923706055 — so binary attributes trade precision for the buffer. At Los Angeles
 * latitudes the resolution is roughly 2e-6 degrees, a little under 0.2 m, which is below
 * anything this map resolves: the density layer paints server-rendered MVT cells, whose
 * resolution is set by the tile rather than by this buffer, and the cluster view merges points
 * within `CLUSTER_RADIUS_PX` (50 px), a distance far larger than 0.2 m at any zoom it draws. It
 * would not be acceptable for the stored point, which is why the backend's `point_geom` keeps
 * full precision and this is only how it reaches the GPU.
 */

/** The shape deck.gl expects for binary `data`. */
type BinaryData = {
  length: number;
  attributes: Record<string, { value: Float32Array; size: number }>;
};

/**
 * Clusters as position and radius buffers, for the bubble layer.
 *
 * The radius is baked in rather than left to an accessor because it is a pure function of the
 * count, which is already known here.
 */
export function clustersToBinary(
  clusters: { latitude: number; longitude: number; count: number }[],
  radiusFor: (count: number) => number,
): BinaryData {
  const positions = new Float32Array(clusters.length * 2);
  const radii = new Float32Array(clusters.length);
  for (let i = 0; i < clusters.length; i++) {
    positions[i * 2] = clusters[i].longitude;
    positions[i * 2 + 1] = clusters[i].latitude;
    radii[i] = radiusFor(clusters[i].count);
  }
  return {
    length: clusters.length,
    attributes: {
      getPosition: { value: positions, size: 2 },
      getRadius: { value: radii, size: 1 },
    },
  };
}
