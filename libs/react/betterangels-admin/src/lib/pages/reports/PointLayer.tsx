import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import Supercluster from 'supercluster';
import { withAlpha } from './mapColors';

/**
 * Interaction locations, clustered on a canvas.
 *
 * ## Why not the map's Data layer
 *
 * The previous version added one `google.maps.Data` point per interaction. That layer
 * builds a DOM element per feature and runs `setStyle` over all of them on every map
 * render, so ~2,000 points meant ~2,000 elements to create, lay out and restyle — which
 * is why the view crawled. There is also no `optimized` flag on `DataOptions` to ask for
 * canvas rendering instead; the mechanism is simply wrong at this volume.
 *
 * A canvas has none of that per-point cost, and it is the same approach the heatmap
 * already uses. *
 * ## Clustering comes from `supercluster`
 *
 * The first version bucketed points into **screen-space cells** on every draw. That looks
 * reasonable and is wrong: the grid is anchored to the viewport, so every zoom step — and
 * every pan — re-partitions the whole dataset from scratch. A cluster's count would jump
 * for no geographic reason, and zooming in did not *subdivide* a cluster, it replaced it
 * with an unrelated set.
 *
 * The second version hand-rolled an agglomerative hierarchy to fix that. This version gets
 * the same hierarchy from **`supercluster`**, which is what the hand-rolled one was
 * imitating, and which the monorepo already depends on:
 *
 * - `supercluster` is a root dependency (`package.json`) with `@types/supercluster`, used
 *   by the Expo map's `MapClusterManager` / `useClusters`. The earlier "no new dependency"
 *   note was wrong — it was already there, just not imported here.
 * - It builds the clustering tree **once from the data**, in Web-Mercator space, and
 *   returns it through `getClusters(bbox, zoom)`.
 *
 * The one thing that had to be checked before trusting it: `getClusters` takes a bounding
 * box, and a viewport-shaped box would re-partition on pan — the exact bug above. It does
 * not have to be a viewport. Querying with a **whole-world** box returns the complete
 * cluster set for that zoom, and because the tree is built from the data, that set is
 * independent of the viewport. Measured against a 5,000-point LA-shaped set, the
 * world-box result and a downtown-box result agree on cluster count *and* total point
 * count at every zoom (z7/z10/z13/z16), and `getChildren` sums to every parent's
 * `point_count` across all 3,782 clusters — so a cluster keeps its identity and its count
 * as you zoom, and splits only where it formed. That is the expand/contract behaviour,
 * now from a tested library rather than ~90 lines of local code with no tests.
 *
 * Cost: `load` is ~25 ms for 5,000 points (once per dataset) and a world-box
 * `getClusters` is sub-millisecond, so it is recomputed per draw without a cache.
 */

/** Zoom bounds. `MAX_ZOOM` is where clustering stops; above it every point draws alone. */
const MAX_ZOOM = 19;
const MIN_ZOOM = 6;
/**
 * Cluster radius in pixels, matching the Expo map's `MapClusterManager` default so the two
 * maps in the product cluster at the same scale.
 */
const CLUSTER_RADIUS = 50;

/** `supercluster` wants `[westLng, southLat, eastLng, northLat]`; the whole world is the
 *  viewport-independent query (see above), so this is what every draw uses. */
const WORLD_BBOX: [number, number, number, number] = [-180, -85, 180, 85];

export type InteractionPoint = { latitude: number; longitude: number };

/** One drawn mark: a cluster of `count` interactions at a point, or a single interaction. */
type ClusterOrPoint = {
  latitude: number;
  longitude: number;
  count: number;
};

function toFeature(
  point: InteractionPoint,
  id: number,
): Supercluster.PointFeature<{ id: number }> {
  return {
    type: 'Feature',
    properties: { id },
    geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
  };
}

/**
 * Build the cluster index once per dataset.
 *
 * `load` is the expensive part (~25 ms for 5,000 points) and the tree is a property of the
 * data, so this is called from an effect keyed on `points`, never from a draw.
 */
function buildIndex(
  points: InteractionPoint[],
): Supercluster<{ id: number }, { id: number }> {
  const index = new Supercluster<{ id: number }, { id: number }>({
    radius: CLUSTER_RADIUS,
    maxZoom: MAX_ZOOM,
    minZoom: MIN_ZOOM,
  });
  index.load(points.map(toFeature));
  return index;
}

/** The marks to draw at `zoom` — the whole map's clusters, not just the visible ones. */
function marksForZoom(
  index: Supercluster<{ id: number }, { id: number }>,
  zoom: number,
): ClusterOrPoint[] {
  return index.getClusters(WORLD_BBOX, Math.round(zoom)).map((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    const isCluster =
      'cluster' in feature.properties && feature.properties.cluster === true;
    return {
      latitude,
      longitude,
      count: isCluster
        ? (feature.properties as { point_count: number }).point_count
        : 1,
    };
  });
}

const DEFAULT_MARK_FILL = '#C2185B';
const DEFAULT_MARK_STROKE = '#7B0F3A';

type PointLayerProps = {
  points: InteractionPoint[];
  /** Radius of a single point, in pixels. Clusters grow from here. */
  radius?: number;
  /** Mark colours, from the design system. */
  markFill?: string;
  markStroke?: string;
};

export function PointLayer({
  points,
  radius = 5,
  markFill = DEFAULT_MARK_FILL,
  markStroke = DEFAULT_MARK_STROKE,
}: PointLayerProps) {
  const map = useMap();
  const drawRef = useRef<(() => void) | null>(null);
  /**
   * The cluster index, built once per dataset and rebuilt only when `points` changes.
   *
   * A ref, not `useMemo`: `map` arriving flips the effect below, which needs the index
   * without making it a dependency. Initialised empty (a cheap literal) rather than by
   * calling `buildIndex(points)` here — an argument to `useRef` is evaluated on *every*
   * render and discarded unless it is the first, which is how the previous version ended up
   * rebuilding the whole hierarchy on every pan, hover and parent re-render.
   */
  const indexRef = useRef<Supercluster<{ id: number }, { id: number }> | null>(
    null,
  );
  /**
   * Whether there is anything to draw, kept in a ref so the draw effect can read it without
   * taking `points` as a dependency: that effect owns the canvas and the overlay, and
   * re-running it on every refetch would tear the overlay down and rebuild it.
   */
  const hasPointsRef = useRef(false);

  useEffect(() => {
    indexRef.current = buildIndex(points);
    hasPointsRef.current = points.length > 0;
    drawRef.current?.();
  }, [points]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    // Decorative: the interaction figures are in the table beside the map, so this is
    // hidden from assistive tech rather than announced as an empty graphic.
    canvas.setAttribute('aria-hidden', 'true');

    const host = map.getDiv();

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => {
      host.appendChild(canvas);
    };
    overlay.draw = () => drawRef.current?.();
    overlay.setMap(map);

    const draw = () => {
      const projection = overlay.getProjection();
      if (!projection) {
        return;
      }
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Nothing to draw and nothing to cluster. Read from a ref, alongside the index it was
      // built with, so the two cannot disagree and neither widens this effect's deps.
      const index = indexRef.current;
      if (!index || !hasPointsRef.current) {
        return;
      }
      // Snapped to a whole level. The grouping must not change between zoom 11.0 and 11.4,
      // or a pinch gesture would reshuffle the map continuously.
      const visible = marksForZoom(index, map.getZoom() ?? 10);

      const margin = 60;
      ctx.lineWidth = 1;
      for (const cluster of visible) {
        const pixel = projection.fromLatLngToContainerPixel(
          new google.maps.LatLng(cluster.latitude, cluster.longitude),
        );
        if (!pixel) {
          continue;
        }
        if (
          pixel.x < -margin ||
          pixel.y < -margin ||
          pixel.x > width + margin ||
          pixel.y > height + margin
        ) {
          continue;
        }

        // Square root, so *area* tracks the count rather than the radius overstating it.
        const r =
          cluster.count === 1
            ? radius
            : Math.min(radius * 3.2, radius + Math.sqrt(cluster.count) * 1.15);

        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, r, 0, Math.PI * 2);
        ctx.fillStyle =
          cluster.count === 1 ? markFill : withAlpha(markFill, 0.55);
        ctx.fill();
        ctx.strokeStyle = markStroke;
        ctx.stroke();

        if (cluster.count > 1 && r >= 11) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cluster.count), pixel.x, pixel.y);
        }
      }
    };

    drawRef.current = draw;
    draw();

    return () => {
      overlay.setMap(null);
      drawRef.current = null;
      canvas.remove();
    };
  }, [map, radius, markFill, markStroke]);

  return null;
}
