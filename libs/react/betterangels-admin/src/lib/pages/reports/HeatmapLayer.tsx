import { useCallback, useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import {
  HEATMAP_RAMP_CSS,
  SAMPLED_LEVELS,
  computeReferencePeaks,
  radiusForZoom,
  rampColor,
  weightFor,
  type HeatPoint,
} from './heatmapMath';

// `RegionMap` renders the legend beside the map, and the legend has to be the same ramp the
// field is painted with — a key maintained separately is a second source of truth, and the
// failure mode (a legend describing colours the map no longer produces) is worse than no key.
// Re-exported so the map imports its ramp from the layer it belongs to.
export { HEATMAP_RAMP_CSS };

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

type HeatmapLayerProps = {
  points: HeatPoint[];
  /**
   * Overall strength. Higher pushes more of the field up the ramp, which suits broad
   * shallow data; lower isolates the peaks.
   */
  intensity?: number;
  /**
   * The raw reference map (per zoom) and the weight a single point carries.
   *
   * A pixel's intensity is `count * weight`, so `reference / weight` is the number of
   * interactions under the densest kernel — what the legend needs in order to say what 100%
   * means. Reported rather than recomputed by the legend: a second copy of the normalisation
   * is a second thing to keep in step.
   */
  onScale?: (reference: Map<number, number>, weight: number) => void;
};

/** Props for the wrapper: the same, but the caller is handed a finished scale. */
type HeatmapWithScaleProps = Omit<HeatmapLayerProps, 'onScale'> & {
  onScale?: (scale: HeatmapScale) => void;
};

/** What the colour scale means, in the units a reader thinks in. */
export type HeatmapScale = {
  zoom: number;
  /** Interactions under the densest kernel at this zoom — the value 100% stands for. */
  count: number;
};

/**
 * The heatmap, plus the number behind its colour scale.
 *
 * Split so the arithmetic lives with the map while the display lives with the legend.
 * `RegionMap` cannot resolve the zoom itself — it renders the map rather than sitting
 * inside it, so `useMap()` there is null — and a legend that cannot see the zoom cannot
 * say what the scale means.
 */
export function HeatmapLayerWithScale({
  points,
  intensity = 0.55,
  onScale,
}: HeatmapWithScaleProps) {
  const map = useMap();

  // The map and the callback are read from refs inside a **stable** handler.
  //
  // Two problems made that necessary. A lazy `useState` initializer runs during the first
  // render, before the Maps library has resolved, so `map` is null there and the zoom would
  // be frozen at its default. And a handler that closed over `zoom` changed identity on
  // every zoom event, which re-ran the layer's effect, cancelled the pending idle work, and
  // meant the scale never arrived at all.
  const mapRef = useRef(map);
  const onScaleRef = useRef(onScale);

  useEffect(() => {
    mapRef.current = map;
    onScaleRef.current = onScale;
  });

  const handleScale = useCallback(
    (reference: Map<number, number>, weight: number) => {
      const live = mapRef.current;
      const zoom = live ? Math.round(live.getZoom() ?? 10) : undefined;
      if (zoom === undefined || weight <= 0) {
        return;
      }
      const current = reference.get(zoom);
      if (current === undefined) {
        return;
      }
      onScaleRef.current?.({ zoom, count: Math.round(current / weight) });
    },
    [],
  );

  return (
    <HeatmapLayer points={points} intensity={intensity} onScale={handleScale} />
  );
}

export function HeatmapLayer({
  points,
  intensity = 0.55,
  onScale,
}: HeatmapLayerProps) {
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
    // Decorative: the interaction figures are in the table beside the map, so this is
    // hidden from assistive tech rather than announced as an empty graphic.
    canvas.setAttribute('aria-hidden', 'true');

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
        if (
          cx < -radius ||
          cy < -radius ||
          cx > width + radius ||
          cy > height + radius
        ) {
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
        data[o + 3] = Math.min(
          255,
          Math.round(235 * Math.pow(normalised, 0.45)),
        );
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
        referenceRef.current = computeReferencePeaks(points, SAMPLED_LEVELS);
        // The reference is accumulated at weight 1 (see `computeReferencePeaks`), so the
        // legend's "100% = N interactions" is `reference / weight`, where `weight` is what the
        // draw pass actually applies. `intensity` therefore lives here, not in the reference.
        onScale?.(referenceRef.current, weightFor(points.length, intensity));
        drawRef.current?.();
      },
      { timeout: 500 },
    );

    return () => cancelIdleCallback(handle);
  }, [points, intensity, onScale]);

  return null;
}
