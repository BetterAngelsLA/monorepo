import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * A gradient heatmap of interaction locations.
 *
 * Drawn on a canvas positioned by `OverlayView`, not as map features. A heatmap is a
 * *continuous field*, and neither of the map's own primitives gives one: markers and
 * Data-layer circles stay discrete however much they overlap, which is what an earlier
 * attempt at this got wrong — it produced a density map wearing a heatmap's name.
 *
 * Two passes. Each point is painted as a soft radial gradient in an offscreen canvas,
 * so overlapping points accumulate into a density surface. The accumulated **alpha** is
 * then used as a mask: a colour ramp is drawn and kept only where the mask is opaque.
 * Concentrated areas come out red, sparse areas blue, and the result is continuous
 * rather than a scatter of shapes.
 *
 * Deliberately not `visualization.HeatmapLayer`: Google **removed** it in Maps JS API
 * 3.65, so it is not an option at any point in future — and its bundled type
 * declaration is `constructor()` with no `setMap`, so it would need a cast the frontend
 * styleguide forbids even if it still existed.
 */

/** Blue through cyan, green and yellow to red, as normalised intensity. */
const RAMP = [
  { stop: 0.0, color: [0, 0, 255] },
  { stop: 0.35, color: [0, 255, 255] },
  { stop: 0.55, color: [0, 255, 0] },
  { stop: 0.75, color: [255, 255, 0] },
  { stop: 1.0, color: [255, 0, 0] },
];

/**
 * Colour for a normalised intensity (0..1), interpolated between stops.
 *
 * Stepped rather than interpolated would band visibly across the field, which reads as
 * a rendering artefact instead of data.
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
  /** Radius of each point's influence, in screen pixels. */
  radius?: number;
};

export function HeatmapLayer({ points, radius = 24 }: HeatmapLayerProps) {
  const map = useMap();
  // Read inside `draw` so panning repaints against the current points without
  // rebuilding the overlay.
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

    const overlay = new google.maps.OverlayView();

    const draw = () => {
      // A projection only exists once the overlay has been added to the map.
      const projection = overlay.getProjection();
      if (!projection) {
        return;
      }
      const current = pointsRef.current;
      const width = Math.max(1, Math.round(map.getDiv().clientWidth));
      const height = Math.max(1, Math.round(map.getDiv().clientHeight));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.clearRect(0, 0, width, height);
      if (current.length === 0) {
        return;
      }

      // Pass 1: accumulate density as alpha, in a single hue.
      for (const point of current) {
        const pixel = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(point.latitude, point.longitude),
        );
        if (!pixel) {
          continue;
        }
        const gradient = ctx.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0.30)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pass 2: recolour by accumulated alpha. This is what makes it a field rather
      // than a pile of translucent discs — colour carries density, not identity.
      const density = ctx.getImageData(0, 0, width, height);
      const out = ctx.createImageData(width, height);
      for (let i = 0; i < density.data.length; i += 4) {
        const alpha = density.data[i + 3];
        if (alpha === 0) {
          continue;
        }
        const [r, g, b] = rampColor(alpha / 255);
        out.data[i] = r;
        out.data[i + 1] = g;
        out.data[i + 2] = b;
        out.data[i + 3] = alpha;
      }
      ctx.putImageData(out, 0, 0);
    };

    drawRef.current = draw;

    // `onAdd` is the only point at which the panes exist, and it is where a detached
    // child element belongs. Attaching outside it silently does nothing.
    overlay.onAdd = () => {
      overlay.getPanes()?.overlayLayer.appendChild(canvas);
    };
    // OverlayView calls this on every map render, which is what keeps the field
    // aligned while panning and zooming.
    overlay.draw = draw;
    overlay.onRemove = () => {
      canvas.remove();
    };
    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
      drawRef.current = null;
      canvas.remove();
    };
  }, [map, radius]);

  // Repaint when the data changes without the viewport moving. Assigning the ref here
  // rather than during render keeps it out of the render phase, which React requires.
  useEffect(() => {
    pointsRef.current = points;
    drawRef.current?.();
  }, [points]);

  return null;
}
