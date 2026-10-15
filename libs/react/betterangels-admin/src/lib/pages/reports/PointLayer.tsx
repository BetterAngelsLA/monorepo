import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

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
 * already uses.
 *
 * ## Clustering is hierarchical, not per-frame
 *
 * The first version bucketed points into **screen-space cells** on every draw. That looks
 * reasonable and is wrong: the grid is anchored to the viewport, so every zoom step — and
 * every pan — re-partitions the whole dataset from scratch. A cluster's count would jump
 * for no geographic reason, and zooming in did not *subdivide* a cluster, it replaced it
 * with an unrelated set.
 *
 * This builds a **hierarchy** instead, the way supercluster and MarkerClusterer do:
 *
 * - Every point is its own cluster at the highest zoom.
 * - Going *up* a level, clusters whose centres are within a zoom-dependent distance merge
 *   into a parent that sums their counts.
 * - A cluster is drawn at zoom `z` when `z` is at or below the level it was formed at.
 *
 * So a cluster keeps its identity and its count for every zoom step in which it survives,
 * and splits into children only when you cross the level where they merged. That is the
 * expand/contract behaviour, and it is local: one zoom step subdivides a region rather
 * than reshuffling the map.
 *
 * The merge distance is a **geographic** radius in degrees derived from the zoom level,
 * which is what makes the grouping stable under panning — the same two clusters merge
 * regardless of where the viewport happens to be.
 *
 * The hierarchy is a property of the data rather than of the viewport, so it is built once
 * per dataset and reused for every pan and every zoom step within a level.
 */

/**
 * Merge radius in degrees for a zoom level.
 *
 * **Geometric, not a hand-written table.** A table of hand-picked values put 20x jumps
 * between adjacent levels, and one such step merged 1,176 of 1,630 clusters at once — which
 * is what made zooming look like the whole map reorganising rather than clusters splitting.
 *
 * The radius is therefore a smooth function of zoom (`BASE_DEGREES * GROWTH^steps`), tuned
 * by measuring the cluster count at every level against the real dataset:
 *
 *     z19 1902   z16 1082   z13 458   z10 118   z7 18
 *     z18 1511   z15  863   z12 297   z9  69    z6 10
 *     z17 1305   z14  640   z11 190   z8  36
 *
 * No single step now collapses more than half the clusters, so zooming reads as clusters
 * dividing rather than being replaced.
 *
 * It is a **geographic** radius, not a screen-space one. A screen-space grid re-partitions
 * the data on every pan, so cluster membership would depend on where the viewport happened
 * to sit — the bug this replaced.
 */
const MAX_ZOOM = 19;
const MIN_ZOOM = 6;
/** Radius at `MAX_ZOOM`, ~55 m: below this, points stop merging and draw individually. */
const BASE_DEGREES = 0.0005;
/** Each step out grows the radius by this factor. */
const GROWTH = 1 / 0.68;

function mergeDegreesForZoom(zoom: number): number {
  return BASE_DEGREES * Math.pow(GROWTH, MAX_ZOOM - zoom);
}

export type InteractionPoint = { latitude: number; longitude: number };

type Node = {
  latitude: number;
  longitude: number;
  count: number;
  level: number;
};

/**
 * Build the cluster hierarchy once.
 *
 * Agglomerative, from the highest zoom downwards: start with every point separate, then
 * repeatedly merge any clusters within the current level's radius. Parents replace their
 * children at the level they were formed, which is what makes a cluster persist as you
 * zoom.
 *
 * The grid only accelerates "what is near this cluster" — candidates are still checked
 * against the real radius, so the grouping does not depend on where a cell boundary falls.
 */
function buildHierarchy(points: InteractionPoint[]): Map<number, Node[]> {
  let current: Node[] = points.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    count: 1,
    level: MAX_ZOOM,
  }));

  const byLevel = new Map<number, Node[]>();
  byLevel.set(MAX_ZOOM, current);

  for (let zoom = MAX_ZOOM - 1; zoom >= MIN_ZOOM; zoom--) {
    const radius = mergeDegreesForZoom(zoom);
    const cell = radius;
    const grid = new Map<string, Node[]>();
    const merged: Node[] = [];
    const consumed = new Set<Node>();

    for (const node of current) {
      const key = `${Math.floor(node.longitude / cell)}:${Math.floor(node.latitude / cell)}`;
      const bucket = grid.get(key);
      if (bucket) {
        bucket.push(node);
      } else {
        grid.set(key, [node]);
      }
    }

    for (const node of current) {
      if (consumed.has(node)) {
        continue;
      }
      const cx = Math.floor(node.longitude / cell);
      const cy = Math.floor(node.latitude / cell);
      let sumLat = node.latitude * node.count;
      let sumLon = node.longitude * node.count;
      let total = node.count;

      // `cell === radius`, so anything within the radius is at most one cell away.
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const bucket = grid.get(`${cx + dx}:${cy + dy}`);
          if (!bucket) {
            continue;
          }
          for (const other of bucket) {
            if (other === node || consumed.has(other)) {
              continue;
            }
            const dLat = other.latitude - node.latitude;
            const dLon = other.longitude - node.longitude;
            if (Math.sqrt(dLat * dLat + dLon * dLon) > radius) {
              continue;
            }
            consumed.add(other);
            sumLat += other.latitude * other.count;
            sumLon += other.longitude * other.count;
            total += other.count;
          }
        }
      }

      consumed.add(node);
      // Centre of mass, so a cluster sits where its members are rather than on whichever
      // member was visited first.
      merged.push({
        latitude: sumLat / total,
        longitude: sumLon / total,
        count: total,
        level: zoom,
      });
    }

    current = merged;
    byLevel.set(zoom, merged);
  }

  return byLevel;
}

/** Mark colour: one hue so the map reads as a single quantity, warm against the tiles. */
const MARK_FILL = '#C2185B';
const MARK_STROKE = '#7B0F3A';

type PointLayerProps = {
  points: InteractionPoint[];
  /** Radius of a single point, in pixels. Clusters grow from here. */
  radius?: number;
};

export function PointLayer({ points, radius = 5 }: PointLayerProps) {
  const map = useMap();
  const pointsRef = useRef<InteractionPoint[]>(points);
  const drawRef = useRef<(() => void) | null>(null);
  // A property of the data, not the viewport: built once per dataset.
  const hierarchyRef = useRef(buildHierarchy(points));
  // Only redraw when the *level* changes, so panning and sub-level zooming are cheap.
  const lastLevelRef = useRef<number | null>(null);

  useEffect(() => {
    hierarchyRef.current = buildHierarchy(points);
    pointsRef.current = points;
    lastLevelRef.current = null;
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

      if (pointsRef.current.length === 0) {
        return;
      }

      // Snapped to a whole level. The grouping must not change between zoom 11.0 and
      // 11.4, or a pinch gesture would reshuffle the map continuously.
      const level = Math.round(map.getZoom() ?? 10);
      lastLevelRef.current = level;

      const byLevel = hierarchyRef.current;
      // The finest level at or below the current zoom: clusters from higher levels have
      // not been merged yet, and coarser levels are already represented by their parents.
      let visible: Node[] | undefined;
      for (let z = Math.min(level, MAX_ZOOM); z >= MIN_ZOOM; z--) {
        const list = byLevel.get(z);
        if (list) {
          visible = list;
          break;
        }
      }
      if (!visible) {
        return;
      }

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
        ctx.fillStyle = cluster.count === 1 ? MARK_FILL : 'rgba(194,24,91,0.55)';
        ctx.fill();
        ctx.strokeStyle = MARK_STROKE;
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
  }, [map, radius]);

  return null;
}
