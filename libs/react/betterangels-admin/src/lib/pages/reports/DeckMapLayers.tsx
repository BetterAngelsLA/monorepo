import { GeoJsonLayer } from '@deck.gl/layers';
// The package's only exported entry re-exports Tile3DLayer, which imports
// @deck.gl/mesh-layers at module scope — so that peer has to be installed even though no 3D
// layer is used. It is a resolution requirement, not a runtime one; tree-shaking keeps it
// out of the build.
import { MVTLayer } from '@deck.gl/geo-layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import type { Layer } from '@deck.gl/core';
import { useEffect, useMemo, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useApiConfig } from '@monorepo/ba-platform';
import { RADIUS_BY_ZOOM, RAMP, type HeatPoint } from './heatmapMath';
import { parseColor } from './mapColors';

/**
 * Both map layers, drawn by deck.gl.
 *
 * This replaces three hand-rolled renderers: a canvas heatmap, a canvas cluster layer, and the
 * choropleth drawn on Google's `map.data`. deck.gl was chosen because Google's own deprecation
 * notice for `google.maps.visualization.HeatmapLayer` names it as the replacement, it is
 * maintained by the vis.gl organisation (the same org as `@vis.gl/react-google-maps`, which
 * this app already uses), and it removes several hundred lines of untested drawing code.
 *
 * ## Why `GoogleMapsOverlay` rather than `<DeckGL>` wrapping `<Map>`
 *
 * The map is configured with `styles` (a stripped basemap) and no `mapId`, i.e. raster
 * rendering. `GoogleMapsOverlay` implements `OverlayView`/`WebGLOverlayView` and supports both
 * raster and vector maps, choosing the method at runtime. deck.gl documents that
 * `GoogleMapsOverlay` has no React integration of its own — it is imperative — so it is
 * constructed in an effect against the map from `useMap()`, which is the wrapper pattern
 * vis.gl documents.
 *
 * ## The colour scale
 *
 * `HeatmapLayer`'s default is to derive the maximum from **the current viewport**, which makes
 * the same place change colour as you pan — the exact problem the hand-rolled version solved.
 * deck.gl exposes the fix as a prop, documented for this purpose: "To obtain a stable color
 * mapping (e.g. for displaying a legend), you need to provide a custom `colorDomain`."
 *
 * So the tested `computeReferencePeaks` is retained for exactly one job: producing that domain.
 * The placement is deliberate. deck.gl's docs and its source disagree about `colorDomain`'s
 * units in `SUM` mode ("weight per square meter" against a source comment saying per pixel), so
 * the domain has to come from something this codebase can verify rather than from a documented
 * constant.
 */

/** deck.gl colours are `[r, g, b]` or `[r, g, b, a]`, all channels 0-255. */
type RgbaTuple = [number, number, number, number];

/** The ramp as `[r, g, b]` triples; `RAMP` already holds them. */
const COLOR_RANGE: [number, number, number][] = RAMP.map((stop) => stop.color);

const hexToRgba = (color: string, alpha: number): RgbaTuple => {
  const [r, g, b] = parseColor(color);
  return [r, g, b, Math.round(alpha * 255)];
};

/**
 * The `colorDomain` for a zoom level, from the pre-computed reference peak.
 *
 * `null` when no reference is available yet, which hands the decision back to deck.gl's
 * viewport default for the first frame — better a briefly swimming scale than a wrong one.
 */
export function colorDomainFor(
  reference: Map<number, number> | null,
  zoom: number,
): [number, number] | null {
  if (!reference) {
    return null;
  }
  const value = reference.get(Math.round(zoom));
  if (value === undefined || value <= 0) {
    return null;
  }
  return [0, value];
}

export type DeckMapLayersProps = {
  /** Interaction locations. Empty when the reader has not grouped by anything. */
  points: HeatPoint[];
  /** Which of the two point renderings to draw. */
  view: 'heatmap' | 'clusters';
  /** Dimension whose boundaries to draw, or `null` when nothing is grouped. */
  regionKind: string | null;
  /** Region counts by code, joined from the rollup. Drives the choropleth fill. */
  counts: Map<string, number>;
  /** Highest count across the rows, for the choropleth ramp. */
  maxCount: number;
  /** Design-system colours, resolved from antd tokens by the caller. */
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
  /** The per-zoom peak the ramp is normalised against. See `computeReferencePeaks`. */
  reference: Map<number, number> | null;
  /** Reported so the legend can state what 100% means at the current level. */
  onZoomChange?: (zoom: number) => void;
};

type BuildLayersArgs = {
  points: HeatPoint[];
  view: 'heatmap' | 'clusters';
  regionKind: string | null;
  counts: Map<string, number>;
  tileUrl: string | null;
  maxCount: number;
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
  reference: Map<number, number> | null;
  zoom: number;
};

/**
 * One definition of the layer stack, used by the render and by the zoom handler.
 *
 * `zoom` is a parameter rather than read from the map inside, because `colorDomain` is derived
 * from it: the zoom handler rebuilds the layers for a level the map has *just* moved to, and
 * reading `getZoom()` again in here would race the event.
 */
function buildLayers({
  points,
  view,
  regionKind,
  counts,
  tileUrl,
  maxCount,
  overlay,
  reference,
  zoom,
}: BuildLayersArgs): Layer[] {
  const layers: Layer[] = [];

  if (regionKind && tileUrl) {
    layers.push(
      new MVTLayer({
        id: `region-boundaries-${regionKind}`,
        // `{z}/{x}/{y}` are substituted per tile. deck.gl fetches only the tiles in view, so
        // the client no longer receives a whole dimension: measured, `coc` is 1281 B for a
        // DTLA tile against 769 kB for the entire layer.
        data: tileUrl,
        minZoom: 0,
        maxZoom: 16,
        filled: true,
        stroked: true,
        // The bounds are the grouping's geography and have to stay readable *through* the
        // heat, so the fill is a light tint and the outline carries the shape.
        getFillColor: (feature) => {
          const code = String(
            (feature.properties as { code?: string })?.code ?? '',
          );
          const count = counts.get(code) ?? 0;
          const t = maxCount > 0 ? Math.sqrt(Math.max(0, count) / maxCount) : 0;
          return hexToRgba(
            overlay.fullFill,
            count > 0 ? 0.18 * t + 0.06 : 0.06,
          );
        },
        getLineColor: hexToRgba(overlay.stroke, 0.85),
        getLineWidth: 1.4,
        lineWidthUnits: 'pixels',
        pickable: false,
        // Tiles arrive after the rollup does, so the fill has to be recomputed when the counts
        // land — otherwise every tile is drawn at the empty shade and never repainted.
        updateTriggers: {
          getFillColor: [maxCount, overlay.fullFill, counts],
          getLineColor: [overlay.stroke],
        },
      }),
    );
  }

  if (points.length > 0 && view === 'heatmap') {
    layers.push(
      new HeatmapLayer<HeatPoint>({
        id: 'interaction-heatmap',
        data: points,
        getPosition: (point: HeatPoint) => [point.longitude, point.latitude],
        // Gaussian KDE on the GPU, replacing the hand-rolled quartic kernel.
        aggregation: 'SUM',
        // The zoomed-out end of the radius table: deck.gl scales the kernel with zoom itself,
        // so this is a reference radius rather than a per-level table.
        radiusPixels: RADIUS_BY_ZOOM[0][1],
        colorRange: COLOR_RANGE,
        // Anchored to the dataset rather than the viewport; see the module docblock.
        colorDomain: colorDomainFor(reference, zoom) ?? undefined,
        pickable: false,
      }),
    );
  }

  if (points.length > 0 && view === 'clusters') {
    layers.push(
      new GeoJsonLayer({
        id: 'interaction-points',
        // One GeoJSON point per interaction. deck.gl batches them on the GPU, so this replaces
        // the canvas cluster layer without the per-point DOM cost that
        // `@googlemaps/markerclusterer`'s DefaultRenderer would incur.
        data: {
          type: 'FeatureCollection',
          features: points.map((point, index) => ({
            type: 'Feature' as const,
            id: index,
            properties: {},
            geometry: {
              type: 'Point' as const,
              coordinates: [point.longitude, point.latitude],
            },
          })),
        } as never,
        pointType: 'circle',
        filled: true,
        stroked: true,
        getFillColor: hexToRgba(overlay.markFill, 0.55),
        getLineColor: hexToRgba(overlay.stroke, 0.9),
        getPointRadius: 5,
        pointRadiusUnits: 'pixels',
        pickable: false,
      }),
    );
  }

  return layers;
}

export function DeckMapLayers({
  points,
  view,
  regionKind,
  counts,
  maxCount,
  overlay,
  reference,
  onZoomChange,
}: DeckMapLayersProps) {
  const map = useMap();
  const { apiUrl } = useApiConfig();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);

  // Absolute because deck.gl's TileLayer fetches the template directly; a relative template
  // would resolve against the page origin rather than the API's.
  const tileUrl = regionKind
    ? `${apiUrl}/regions/tiles/${regionKind}/{z}/{x}/{y}.mvt`
    : null;
  const zoomRef = useRef<number | null>(null);

  const layers = useMemo(
    () =>
      buildLayers({
        points,
        view,
        regionKind,
        counts,
        tileUrl,
        maxCount,
        overlay,
        reference,
        zoom: map?.getZoom() ?? 10,
      }),
    [
      points,
      view,
      regionKind,
      counts,
      tileUrl,
      maxCount,
      overlay,
      reference,
      map,
    ],
  );

  // One overlay per map, reused across renders. deck.gl diffs the layer array itself, so the
  // overlay is created once and updated with `setProps` — recreating it would throw away the
  // WebGL context on every render.
  useEffect(() => {
    if (!map) {
      return;
    }
    if (!overlayRef.current) {
      overlayRef.current = new GoogleMapsOverlay({ layers });
      overlayRef.current.setMap(map);
    } else {
      overlayRef.current.setProps({ layers });
    }
  }, [map, layers]);

  useEffect(
    () => () => {
      overlayRef.current?.setMap(null);
      overlayRef.current?.finalize();
      overlayRef.current = null;
    },
    [],
  );

  // Rebuild on zoom so `colorDomain` follows the level, and report the zoom for the legend.
  useEffect(() => {
    if (!map) {
      return;
    }
    const listener = map.addListener('zoom_changed', () => {
      const zoom = map.getZoom() ?? 10;
      if (zoom === zoomRef.current) {
        return;
      }
      zoomRef.current = zoom;
      onZoomChange?.(zoom);
      overlayRef.current?.setProps({
        layers: buildLayers({
          points,
          view,
          regionKind,
          counts,
          tileUrl,
          maxCount,
          overlay,
          reference,
          zoom,
        }),
      });
    });
    return () => google.maps.event.removeListener(listener);
  }, [
    map,
    points,
    view,
    regionKind,
    counts,
    tileUrl,
    maxCount,
    overlay,
    reference,
    onZoomChange,
  ]);

  return null;
}
