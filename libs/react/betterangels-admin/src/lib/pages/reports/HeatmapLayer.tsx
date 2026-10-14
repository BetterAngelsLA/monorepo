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
      const weight = intensity / Math.max(1, Math.sqrt(current.length));

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

      let max = 0;
      for (let i = 0; i < acc.length; i++) {
        if (acc[i] > max) {
          max = acc[i];
        }
      }
      if (max <= 0) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

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

  // Repaint when the data changes without the viewport moving.
  useEffect(() => {
    pointsRef.current = points;
    drawRef.current?.();
  }, [points]);

  return null;
}
