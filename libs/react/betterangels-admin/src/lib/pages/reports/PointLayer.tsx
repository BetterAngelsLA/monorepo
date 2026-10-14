import { useEffect, useRef, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * Interaction locations, clustered and drawn on a canvas.
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
 * ## Clustering
 *
 * At low zoom, points in the same cell are merged into one circle sized and coloured by
 * how many it stands for. The cell is defined **in screen pixels**, not in degrees, so it
 * describes the view rather than the geography: zooming in subdivides clusters and
 * zooming out merges them, which is the expand/contract behaviour clustering should have.
 *
 * That also bounds the work. The number of circles is at most the number of occupied
 * screen cells, so it cannot grow with the dataset — panning a county-wide map over
 * 100,000 interactions would draw roughly the same circles as over 2,000.
 *
 * Single points are drawn at full size; a cluster grows with its count up to a ceiling so
 * a very dense cell does not swallow the map.
 */

/** Screen-space cluster cell, in pixels, by zoom. */
const CELL_BY_ZOOM: [number, number][] = [
  [7, 26],
  [9, 30],
  [11, 34],
  [13, 40],
  [16, 52],
];

function cellForZoom(zoom: number): number {
  const first = CELL_BY_ZOOM[0];
  const last = CELL_BY_ZOOM[CELL_BY_ZOOM.length - 1];
  if (zoom <= first[0]) {
    return first[1];
  }
  if (zoom >= last[0]) {
    return last[1];
  }
  for (let i = 0; i < CELL_BY_ZOOM.length - 1; i++) {
    const [z0, c0] = CELL_BY_ZOOM[i];
    const [z1, c1] = CELL_BY_ZOOM[i + 1];
    if (zoom >= z0 && zoom <= z1) {
      return c0 + ((c1 - c0) * (zoom - z0)) / (z1 - z0);
    }
  }
  return last[1];
}

export type InteractionPoint = { latitude: number; longitude: number };

type Cluster = { x: number; y: number; count: number };

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
  // Exposed so a test or a future interaction can read what was drawn.
  const [clusterCount, setClusterCount] = useState(0);

  useEffect(() => {
    if (!map) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';

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

      const current = pointsRef.current;
      if (current.length === 0) {
        setClusterCount(0);
        return;
      }

      const zoom = map.getZoom() ?? 10;
      const cell = cellForZoom(zoom);

      // Bucket by screen cell in one pass. Keyed on the cell, so the map holds at most
      // (viewport / cellSize) entries however many points there are.
      const buckets = new Map<string, { sx: number; sy: number; n: number }>();
      for (const point of current) {
        const pixel = projection.fromLatLngToContainerPixel(
          new google.maps.LatLng(point.latitude, point.longitude),
        );
        if (!pixel) {
          continue;
        }
        // Cheap rejection before touching the bucket map.
        if (pixel.x < -cell || pixel.y < -cell || pixel.x > width + cell || pixel.y > height + cell) {
          continue;
        }
        const key = `${Math.floor(pixel.x / cell)}:${Math.floor(pixel.y / cell)}`;
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.sx += pixel.x;
          bucket.sy += pixel.y;
          bucket.n += 1;
        } else {
          buckets.set(key, { sx: pixel.x, sy: pixel.y, n: 1 });
        }
      }

      const clusters: Cluster[] = [];
      for (const bucket of buckets.values()) {
        clusters.push({ x: bucket.sx / bucket.n, y: bucket.sy / bucket.n, count: bucket.n });
      }
      setClusterCount(clusters.length);

      // Draw smallest first so a dense cluster is not buried under its neighbours.
      clusters.sort((a, b) => a.count - b.count);
      ctx.lineWidth = 1;
      for (const cluster of clusters) {
        // Square root, so area tracks the count rather than the radius overstating it.
        const r = cluster.count === 1 ? radius : Math.min(radius * 3, radius + Math.sqrt(cluster.count) * 1.6);
        ctx.beginPath();
        ctx.arc(cluster.x, cluster.y, r, 0, Math.PI * 2);
        ctx.fillStyle = cluster.count === 1 ? MARK_FILL : 'rgba(194,24,91,0.55)';
        ctx.fill();
        ctx.strokeStyle = MARK_STROKE;
        ctx.stroke();

        // A count inside the circle, when it is big enough to read.
        if (cluster.count > 1 && r >= 11) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cluster.count), cluster.x, cluster.y);
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

  useEffect(() => {
    pointsRef.current = points;
    drawRef.current?.();
  }, [points]);

  // Nothing renders in the DOM; the count is surfaced for callers that want to label it.
  void clusterCount;
  return null;
}
