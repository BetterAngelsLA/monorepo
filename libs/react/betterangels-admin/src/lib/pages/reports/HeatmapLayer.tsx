import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * A gradient heatmap of interaction locations.
 *
 * Drawn on a canvas, not as map features. A heatmap is a *continuous field*, and
 * neither of the map's own primitives gives one: markers and Data-layer circles stay
 * discrete however much they overlap, which is what a first attempt at this got wrong —
 * it produced a density map wearing a heatmap's name.
 *
 * ## How the field is built
 *
 * Every point contributes a smooth kernel, and the contributions are **summed** into a
 * single-channel intensity buffer, which is then normalised and colourised.
 *
 * Two details are what make it cluster rather than blob:
 *
 * 1. **Sum, then normalise — do not composite alpha.** Painting translucent discs with
 *    `source-over` accumulates toward an asymptote: once a dozen overlap the channel is
 *    saturated, so a cell with 50 interactions looks identical to one with 500 and the
 *    field flattens onto the top of the ramp. Summing linear intensities keeps the
 *    differences, and normalising by the observed maximum stretches whatever range the
 *    data actually has across the whole ramp.
 * 2. **A smooth kernel with a hard cutoff**, not a linear `addColorStop` gradient. A
 *    linear falloff ends on a visible edge, so isolated points read as discs; a quartic
 *    kernel reaches zero and fades into the background.
 *
 * ## Scale
 *
 * Radius and per-point weight follow the zoom, so the field describes density *at the
 * scale you are looking at* rather than a fixed pixel smear. Zoomed out, a wide kernel
 * merges neighbours into the clusters a reader is looking for; zoomed in, it tightens so
 * individual concentrations separate.
 *
 * ## Why the canvas is anchored to the map container
 *
 * The canvas is a child of the map's own div at its top-left, and points are projected
 * with `fromLatLngToContainerPixel` — measured from that same origin. An earlier version
 * attached the canvas to `overlayLayer` and projected with `fromLatLngToDivPixel`, which
 * is measured from the *panning* pane; the two origins disagreed, so the field slid away
 * from the geography beneath it on every pan.
 *
 * Deliberately not `visualization.HeatmapLayer`: Google **removed** it in Maps JS API
 * 3.65, so it is not an option at any point in future.
 */

/** Blue through cyan, green and yellow to red, as normalised intensity. */
const RAMP = [
  { stop: 0.0, color: [40, 60, 200] },
  { stop: 0.3, color: [0, 190, 255] },
  { stop: 0.5, color: [0, 210, 90] },
  { stop: 0.72, color: [255, 216, 0] },
  { stop: 1.0, color: [220, 30, 20] },
];

/**
 * The ramp as a CSS gradient, derived from the same stops the canvas paints with.
 *
 * Exported so the legend cannot drift from the map: a legend maintained separately is a
 * second source of truth, and the failure mode — a key that describes colours the map no
 * longer produces — is worse than having no key at all.
 */
export const HEATMAP_RAMP_CSS = `linear-gradient(to right, ${RAMP.map(
  ({ stop, color }) => `rgb(${color.join(',')}) ${(stop * 100).toFixed(0)}%`,
).join(', ')})`;

/**
 * Radius in pixels at each zoom, interpolated between. Wide when zoomed out so nearby
 * points merge into a cluster; tight when zoomed in so structure is visible rather than
 * smeared.
 */
const RADIUS_BY_ZOOM: [number, number][] = [
  [7, 60],
  [9, 40],
  [11, 26],
  [13, 16],
  [16, 11],
];

function radiusForZoom(zoom: number): number {
  const first = RADIUS_BY_ZOOM[0];
  const last = RADIUS_BY_ZOOM[RADIUS_BY_ZOOM.length - 1];
  if (zoom <= first[0]) {
    return first[1];
  }
  if (zoom >= last[0]) {
    return last[1];
  }
  for (let i = 0; i < RADIUS_BY_ZOOM.length - 1; i++) {
    const [z0, r0] = RADIUS_BY_ZOOM[i];
    const [z1, r1] = RADIUS_BY_ZOOM[i + 1];
    if (zoom >= z0 && zoom <= z1) {
      return r0 + ((r1 - r0) * (zoom - z0)) / (z1 - z0);
    }
  }
  return last[1];
}

/** Weight per point, matching the draw pass. */
function weightFor(count: number, intensity: number): number {
  return intensity / Math.max(1, Math.sqrt(count));
}

/**
 * The intensity scale, fixed against panning.
 *
 * The draw pass accumulates into the viewport buffer, so the largest value in that buffer
 * is the hottest spot *currently on screen*. Normalising by it makes the colour scale a
 * property of the viewport: pan toward a dense area and everything else cools, pan away and
 * the midrange flares — the same place changes colour without its data changing.
 *
 * So the scale is taken from elsewhere. Because each point contributes
 * `weight * (1 - d²/r²)²` and those contributions simply add, the peak over the *whole*
 * dataset is an upper bound on any pixel of any viewport. Using it as the normalising
 * constant makes the ramp a pure function of the data — no pan can move it — with the
 * density of any one area expressed relative to the dataset's busiest.
 *
 * A **geographic** grid finds it: points are bucketed at roughly the kernel's footprint and
 * the fullest bucket is the reference. That is one pass per zoom over the points, rather
 * than walking every point's kernel over a buffer, and it is what makes the scale
 * independent of where the viewport happens to be.
 */
/** Zoom levels the scale reference is computed for; matches the map's usable range. */
const ZOOM_LEVELS = Array.from({ length: 14 }, (_, i) => i + 6);

function computeReferencePeaks(
  points: HeatPoint[],
  intensity: number,
  zoomLevels: number[],
): Map<number, number> {
  const peaks = new Map<number, number>();
  const weight = weightFor(points.length, intensity);
  if (points.length === 0) {
    return peaks;
  }

  for (const zoom of zoomLevels) {
    // The kernel's footprint in degrees at this zoom, so the reference is in the same units
    // as the accumulation. Web Mercator is ~156,543 m/px at the equator at z0, so a pixel
    // spans `156543 * cos(lat) * 2^-zoom` metres; LA is ~34°N. Without this the kernel's
    // geographic size would be ignored and every zoom would be scaled differently.
    const metresPerPixel = (156543 * Math.cos((34 * Math.PI) / 180)) / Math.pow(2, zoom);
    // One cell per **pixel**, so the bucket grid is the accumulation grid. Using the
    // kernel's own width here made the footprint three times too large, so the reference
    // overshot the true peak by ~2-3x and the top of the ramp was never reached.
    const cell = Math.max(metresPerPixel / 111320, 1e-12);
    const pixels = radiusForZoom(zoom);

    // Weighted point count per cell. A kernel is several cells wide, so a bucket that falls
    // inside many kernels accumulates many cells' worth — that accumulation *is* the
    // intensity, and the fullest cell is the reference.
    const buckets = new Map<string, number>();
    for (const point of points) {
      const key = `${Math.floor(point.longitude / cell)}:${Math.floor(point.latitude / cell)}`;
      buckets.set(key, (buckets.get(key) ?? 0) + weight);
    }

    // Built once per zoom rather than per point — that was the bulk of the cost.
    const span = Math.ceil(pixels);
    const radiusSq = pixels * pixels;
    const offsets: [number, number, number][] = [];
    for (let dy = -span; dy <= span; dy++) {
      for (let dx = -span; dx <= span; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > radiusSq) {
          continue;
        }
        const t = 1 - d2 / radiusSq;
        offsets.push([dx, dy, t * t]);
      }
    }

    let peak = 0;
    for (const [key, own] of buckets) {
      const [cx, cy] = key.split(':').map(Number);
      let value = 0;
      for (const [dx, dy, shape] of offsets) {
        const neighbour = buckets.get(`${cx + dx}:${cy + dy}`);
        if (neighbour) {
          value += neighbour * shape;
        }
      }
      // `own` is included above; the guard keeps a lone cell from reading as zero.
      if (value <= 0) {
        value = own;
      }
      if (value > peak) {
        peak = value;
      }
    }

    peaks.set(zoom, peak);
  }

  return peaks;
}

/**
 * Colour for a normalised intensity (0..1), interpolated between stops.
 *
 * Stepped rather than interpolated would band visibly across the field, which reads as a
 * rendering artefact instead of data.
 */
function rampColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  const upper = RAMP.findIndex((stop) => clamped <= stop.stop);
  if (upper <= 0) {
    return RAMP[0].color as [number, number, number];
  }
  const hi = RAMP[upper];
  const lo = RAMP[upper - 1];
  const span = hi.stop - lo.stop || 1;
  const f = (clamped - lo.stop) / span;
  return [
    Math.round(lo.color[0] + (hi.color[0] - lo.color[0]) * f),
    Math.round(lo.color[1] + (hi.color[1] - lo.color[1]) * f),
    Math.round(lo.color[2] + (hi.color[2] - lo.color[2]) * f),
  ];
}

export type HeatPoint = { latitude: number; longitude: number };

type HeatmapLayerProps = {
  points: HeatPoint[];
  /**
   * Overall strength. Higher pushes more of the field up the ramp, which suits broad
   * shallow data; lower isolates the peaks.
   */
  intensity?: number;
};

export function HeatmapLayer({ points, intensity = 0.55 }: HeatmapLayerProps) {
  const map = useMap();
  const pointsRef = useRef<HeatPoint[]>(points);
  // Fixed for a given dataset, so a pan cannot rescale the ramp.
  // Scale reference per zoom, from the dataset rather than the viewport. Computed
  // asynchronously: it is exact and therefore not cheap (a few hundred ms), and blocking
  // the first paint on it is worse than drawing once with the viewport's own peak as a
  // fallback. Kept in a ref, so the redraw does not recreate the canvas.
  const referenceRef = useRef<Map<number, number> | null>(null);
  const drawRef = useRef<(() => void) | null>(null);

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
    // One channel of accumulated intensity, reused across draws so a pan does not
    // reallocate a full-size buffer each frame.
    let acc: Float32Array | null = null;

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

      // Assigning width/height clears the canvas, so only when the size changed.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        acc = null;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      if (!acc || acc.length !== width * height) {
        acc = new Float32Array(width * height);
      }

      const current = pointsRef.current;
      if (current.length === 0) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      acc.fill(0);
      const zoom = map.getZoom() ?? 10;
      const radius = radiusForZoom(zoom);
      const radiusSq = radius * radius;
      // Divided by the point count so a dense set does not simply saturate; the
      // normalisation below rescales to whatever range results.
      const weight = weightFor(current.length, intensity);

      for (const point of current) {
        const pixel = projection.fromLatLngToContainerPixel(
          new google.maps.LatLng(point.latitude, point.longitude),
        );
        if (!pixel) {
          continue;
        }
        const cx = pixel.x;
        const cy = pixel.y;
        if (cx < -radius || cy < -radius || cx > width + radius || cy > height + radius) {
          continue;
        }
        const x0 = Math.max(0, Math.floor(cx - radius));
        const x1 = Math.min(width - 1, Math.ceil(cx + radius));
        const y0 = Math.max(0, Math.floor(cy - radius));
        const y1 = Math.min(height - 1, Math.ceil(cy + radius));

        for (let y = y0; y <= y1; y++) {
          const dy = y - cy;
          const rowBase = y * width;
          for (let x = x0; x <= x1; x++) {
            const dx = x - cx;
            const distSq = dx * dx + dy * dy;
            if (distSq >= radiusSq) {
              continue;
            }
            // Quartic falloff: flat at the centre, exactly zero at the radius, so
            // kernels fade into the background instead of ending on an edge.
            const t = 1 - distSq / radiusSq;
            acc[rowBase + x] += weight * t * t;
          }
        }
      }

      // The fixed reference for this zoom, not `Math.max(...acc)`. The buffer only holds
      // what is on screen, so using its own peak would make the ramp a function of the
      // viewport and the colours would swim as the map is panned.
      const reference = referenceRef.current?.get(Math.round(zoom)) ?? 0;
      let viewportMax = 0;
      for (let i = 0; i < acc.length; i++) {
        if (acc[i] > viewportMax) {
          viewportMax = acc[i];
        }
      }
      if (viewportMax <= 0) {
        ctx.clearRect(0, 0, width, height);
        return;
      }
      // Deliberately **not** `Math.max(reference, viewportMax)`: letting the visible data
      // raise the scale re-introduces exactly the viewport dependence this removes. A
      // value above the reference clamps and saturates, which is what a fixed ramp does.
      const max = reference > 0 ? reference : viewportMax;

      const image = ctx.createImageData(width, height);
      const data = image.data;
      for (let i = 0; i < acc.length; i++) {
        const value = acc[i];
        if (value <= 0) {
          continue;
        }
        // Normalise, then a mild gamma. Pure linear normalisation leaves everything
        // outside the single hottest spot looking cold; the curve lifts the midrange so
        // secondary clusters are legible without flattening the peak.
        const normalised = Math.pow(value / max, 0.75);
        const [r, g, b] = rampColor(normalised);
        const o = i * 4;
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        // Alpha follows intensity too, so the edge of the field dissolves into the map
        // rather than sitting on a hard boundary.
        data[o + 3] = Math.min(255, Math.round(235 * Math.pow(normalised, 0.45)));
      }
      ctx.putImageData(image, 0, 0);
    };

    drawRef.current = draw;
    draw();

    return () => {
      overlay.setMap(null);
      drawRef.current = null;
      canvas.remove();
    };
  }, [map, intensity]);

  // Repaint when the data changes without the viewport moving, and recompute the scale
  // reference — it is derived from the points, so it moves with them.
  useEffect(() => {
    pointsRef.current = points;
    referenceRef.current = null;
    drawRef.current?.();

    if (points.length === 0) {
      return;
    }

    // Deferred so a slow reference never delays the map. The first draw falls back to the
    // viewport peak, then the fixed scale arrives a frame later. `requestIdleCallback` is
    // widely available; where it is not, the fallback is skipped and the initial scale
    // simply stands, which is correct behaviour rather than a degraded one.
    if (typeof requestIdleCallback !== 'function') {
      return;
    }
    const handle = requestIdleCallback(
      () => {
        referenceRef.current = computeReferencePeaks(points, intensity, ZOOM_LEVELS);
        drawRef.current?.();
      },
      { timeout: 2000 },
    );

    return () => cancelIdleCallback(handle);
  }, [points, intensity]);

  return null;
}
