/**
 * The heatmap's arithmetic, separated from the painting.
 *
 * Everything here is a pure function of its arguments — no canvas, no map, no DOM — so it
 * can be tested directly. It lived inside `HeatmapLayer.tsx` next to the drawing code,
 * where none of it was reachable by a test: ~125 lines of tuned arithmetic whose failures
 * are invisible, because a wrong heatmap still renders — it is just wrong.
 *
 * The invariant that matters most is that the colour scale is a property of the
 * **dataset**, not the viewport. A scale normalised against what happens to be on screen
 * makes the same place change colour as you pan, which is what `computeReferencePeaks`
 * exists to prevent and what `heatmapMath.test.ts` now pins.
 */

import { lerpRgb, type Rgb } from './mapColors';

/** Blue through cyan, green and yellow to red, as normalised intensity. */
/** One stop on the colour ramp: a normalised intensity and the colour it maps to. */
type RampStop = { stop: number; color: Rgb };

export const RAMP: RampStop[] = [
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
export const RADIUS_BY_ZOOM: [number, number][] = [
  [7, 60],
  [9, 40],
  [11, 26],
  [13, 16],
  [16, 11],
];

export function radiusForZoom(zoom: number): number {
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
export function weightFor(count: number, intensity: number): number {
  return intensity / Math.max(1, Math.sqrt(count));
}

/**
 * Levels the reference is *computed* for. Every second one: the value varies smoothly with
 * zoom, so the levels between are interpolated geometrically (these values span orders of
 * magnitude, so a linear interpolation would be wrong). Computing all fourteen costs 4.4s
 * against the real dataset; every second level costs 2.3s for a worst-case deviation of
 * 1.42x, which is invisible on a colour ramp.
 */
export const SAMPLED_LEVELS = [6, 8, 10, 12, 14, 16, 18];

export function computeReferencePeaks(
  points: HeatPoint[],
  zoomLevels: number[],
): Map<number, number> {
  const peaks = new Map<number, number>();
  if (points.length === 0) {
    return peaks;
  }
  /**
   * **The reference is accumulated at a fixed weight of 1, deliberately.**
   *
   * It used to use the draw pass's `weightFor(points.length, intensity)`, which scales as
   * `1/sqrt(n)` — so the reference depended on how many points exist *anywhere in the
   * dataset*, not on how they are distributed. Measured: 500 dense downtown points give a
   * reference of 5.86; append 500 points in Orange County, which contribute nothing to the
   * downtown peak, and it falls to 4.85 — the whole map recolours by 17% because unrelated
   * data was recorded. Every new interaction in the platform moved the scale.
   *
   * With a fixed weight the reference is a function of the spatial distribution alone, so
   * growth elsewhere cannot move it. `intensity` is applied where it belongs instead: the
   * draw pass divides through by its own weight, and the legend reports
   * `reference / weight` — so the dial moves the picture without moving what the picture
   * is normalised against.
   */

  for (const zoom of zoomLevels) {
    // The kernel's footprint in degrees at this zoom, so the reference is in the same units
    // as the accumulation. Web Mercator is ~156,543 m/px at the equator at z0, so a pixel
    // spans `156543 * cos(lat) * 2^-zoom` metres; LA is ~34°N. Without this the kernel's
    // geographic size would be ignored and every zoom would be scaled differently.
    const metresPerPixel =
      (156543 * Math.cos((34 * Math.PI) / 180)) / Math.pow(2, zoom);
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
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
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

  // The gaps. Sampling every second level halves the cost (4.4s -> 2.3s on the real
  // dataset), and the value varies smoothly enough that interpolation costs at most a 1.42x
  // deviation — invisible on a colour ramp. Interpolated **geometrically**, because these
  // values span orders of magnitude across the zoom range and a linear blend would be wrong
  // by a wide margin at the coarse end.
  const interpolated = new Map<number, number>(peaks);
  const computed = [...peaks.keys()].sort((a, b) => a - b);
  for (let zoom = computed[0]; zoom <= computed[computed.length - 1]; zoom++) {
    if (interpolated.has(zoom)) {
      continue;
    }
    const lower = computed.filter((z) => z < zoom).pop();
    const upper = computed.find((z) => z > zoom);
    if (lower === undefined || upper === undefined) {
      continue;
    }
    const a = peaks.get(lower) as number;
    const b = peaks.get(upper) as number;
    const t = (zoom - lower) / (upper - lower);
    interpolated.set(
      zoom,
      Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t),
    );
  }

  return interpolated;
}

/**
 * Colour for a normalised intensity (0..1), interpolated between stops.
 *
 * Stepped rather than interpolated would band visibly across the field, which reads as a
 * rendering artefact instead of data.
 */
export function rampColor(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  const upper = RAMP.findIndex((stop) => clamped <= stop.stop);
  if (upper <= 0) {
    return RAMP[0].color;
  }
  const hi = RAMP[upper];
  const lo = RAMP[upper - 1];
  const span = hi.stop - lo.stop || 1;
  // Shared with the choropleth's `shade`, which blends between two tokens the same way.
  return lerpRgb(lo.color, hi.color, (clamped - lo.stop) / span);
}

/** One interaction location, as the layers hand it around. */
export type HeatPoint = { latitude: number; longitude: number };
