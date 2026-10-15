import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
// The package's only exported entry re-exports Tile3DLayer, which imports
// @deck.gl/mesh-layers at module scope — so that peer has to be installed even though no 3D
// layer is used. It is a resolution requirement, not a runtime one; tree-shaking keeps it
// out of the build.
import { MVTLayer } from '@deck.gl/geo-layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import type { Layer } from '@deck.gl/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useApiConfig } from '@monorepo/ba-platform';
import { HEATMAP_RADIUS_PX, RAMP, type HeatPoint } from './heatmapMath';
import { clusterPoints, clusterRadius, type Cluster } from './clusterPoints';
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
 */

/** deck.gl colours are `[r, g, b]` or `[r, g, b, a]`, all channels 0-255. */
type RgbaTuple = [number, number, number, number];

/** The ramp as `[r, g, b]` triples; `RAMP` already holds them. */
const COLOR_RANGE: [number, number, number][] = RAMP.map((stop) => stop.color);

const hexToRgba = (color: string, alpha: number): RgbaTuple => {
  const [r, g, b] = parseColor(color);
  return [r, g, b, Math.round(alpha * 255)];
};

export type DeckMapLayersProps = {
  /** Interaction locations. Empty when the reader has not grouped by anything. */
  points: HeatPoint[];
  /** Which of the two point renderings to draw. */
  view: 'heatmap' | 'clusters';
  /** Dimension whose boundaries to draw, or `null` when nothing is grouped. */
  regionKind: string | null;
  /** Region counts by code, joined from the rollup. Drives the choropleth fill. */
  counts: Map<string, number>;
  /** Regions the reader has drilled into. Empty means every region is in scope. */
  focusCodes: string[];
  /** Highest count across the rows, for the choropleth ramp. */
  maxCount: number;
  /** Design-system colours, resolved from antd tokens by the caller. */
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
};

type BuildLayersArgs = {
  points: HeatPoint[];
  view: 'heatmap' | 'clusters';
  regionKind: string | null;
  counts: Map<string, number>;
  focusCodes: string[];
  tileUrl: string | null;
  maxCount: number;
  /** Current map level. The cluster bins are cut in screen space, so this cuts them. */
  zoom: number;
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
};

/**
 * One definition of the layer stack.
 *
 * `zoom` is a parameter because the cluster bins are cut in screen space: a bubble splits as
 * the reader zooms in, and that is a property of the level, not of the data.
 */
function buildLayers({
  points,
  view,
  regionKind,
  counts,
  focusCodes,
  tileUrl,
  maxCount,
  overlay,
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
        // The tile endpoint is on the API's origin, not the app's, and it needs the session.
        // deck.gl's own fetch does not send cookies cross-origin, so every tile came back
        // 403 {"detail":"Authentication credentials were not provided."} and the boundary
        // layer drew nothing at all. Apollo's credentials interceptor does not reach here.
        loadOptions: { fetch: { credentials: 'include' } },
        minZoom: 0,
        maxZoom: 16,
        filled: true,
        stroked: true,
        // Every boundary is drawn even when the reader has drilled into one district: tiles
        // cannot be filtered by a code list — a tile URL is a template and `codes` is not part
        // of it — and a single district with nothing around it loses the geography that makes
        // it locatable. Focus is shown by emphasis instead of omission.
        getFillColor: (feature) => {
          const code = String(
            (feature.properties as { code?: string })?.code ?? '',
          );
          const count = counts.get(code) ?? 0;
          const t = maxCount > 0 ? Math.sqrt(Math.max(0, count) / maxCount) : 0;
          const alpha = count > 0 ? 0.18 * t + 0.06 : 0.06;
          const faded = focusCodes.length > 0 && !focusCodes.includes(code);
          return hexToRgba(overlay.fullFill, faded ? alpha * 0.35 : alpha);
        },
        getLineColor: (feature) => {
          const code = String(
            (feature.properties as { code?: string })?.code ?? '',
          );
          const faded = focusCodes.length > 0 && !focusCodes.includes(code);
          return hexToRgba(overlay.stroke, faded ? 0.3 : 0.85);
        },
        // The focused districts get a heavier outline, which is what carries the drill-down now
        // that the layer is not narrowed to them.
        getLineWidth: (feature) => {
          const code = String(
            (feature.properties as { code?: string })?.code ?? '',
          );
          return focusCodes.includes(code) ? 2.4 : 1.4;
        },
        lineWidthUnits: 'pixels',
        pickable: false,
        // Tiles arrive after the rollup does, so the fill has to be recomputed when the counts
        // land — otherwise every tile is drawn at the empty shade and never repainted.
        updateTriggers: {
          getFillColor: [maxCount, overlay.fullFill, counts, focusCodes],
          getLineColor: [overlay.stroke, focusCodes],
          getLineWidth: [focusCodes],
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
        radiusPixels: HEATMAP_RADIUS_PX,
        colorRange: COLOR_RANGE,
        // No `colorDomain`: deck derives it from the data, which is stable across pans and
        // on the same scale as the aggregation it is applied to. See `heatmapMath.ts`.
        pickable: false,
      }),
    );
  }

  if (points.length > 0 && view === 'clusters') {
    const clusters = clusterPoints(points, zoom);
    layers.push(
      new ScatterplotLayer<Cluster>({
        id: 'interaction-clusters',
        data: clusters,
        getPosition: (cluster: Cluster) => [cluster.longitude, cluster.latitude],
        // Radius from the count, in pixels: the bubble stands for *n* interactions and its
        // area says how many, so a lone interaction is still a visible dot.
        getRadius: (cluster: Cluster) => clusterRadius(cluster.count),
        radiusUnits: 'pixels',
        filled: true,
        stroked: true,
        getFillColor: hexToRgba(overlay.markFill, 0.55),
        getLineColor: hexToRgba(overlay.stroke, 0.9),
        pickable: false,
      }),
      new TextLayer<Cluster>({
        id: 'interaction-cluster-counts',
        data: clusters.filter((cluster: Cluster) => cluster.count > 1),
        getPosition: (cluster: Cluster) => [cluster.longitude, cluster.latitude],
        getText: (cluster: Cluster) => String(cluster.count),
        // The count is the whole point of a bubble; a bin of one is just a dot and would be
        // shouting "1" over the whole map.
        getSize: 12,
        sizeUnits: 'pixels',
        getColor: [255, 255, 255],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        // No `fontFamily: 'inherit'`: the text layer bakes glyphs into a font atlas from a real
        // font name, and a CSS keyword resolves to nothing — the bubbles drew with no numbers
        // in them at all. deck's default face is the one it has an atlas for.
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
  focusCodes,
  maxCount,
  overlay,
}: DeckMapLayersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(10);
  const { apiUrl } = useApiConfig();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);

  // Absolute because deck.gl's TileLayer fetches the template directly; a relative template
  // would resolve against the page origin rather than the API's.
  // Lowercased: `RegionDimension` spells the dimension uppercase (`COUNCIL_DISTRICT`) and the
  // endpoint matches the wire `kind`, which is lowercase. Sending the enum as-is made every
  // tile 404 — measured, `COUNCIL_DISTRICT/8/43/102` 404 against `council_district/8/43/102`
  // 200 with 4.4 kB of geometry — so the boundary layer drew nothing at all.
  const tileUrl = regionKind
    ? `${apiUrl}/regions/tiles/${regionKind.toLowerCase()}/{z}/{x}/{y}.mvt`
    : null;

  const layers = useMemo(
    () =>
      buildLayers({
        points,
        view,
        regionKind,
        counts,
        focusCodes,
        tileUrl,
        maxCount,
        overlay,
        zoom,
      }),
    [
      points,
      view,
      regionKind,
      counts,
      focusCodes,
      tileUrl,
      maxCount,
      overlay,
      zoom,
    ],
  );

  // The cluster bins are cut in screen space, so they are a function of the zoom level and
  // nothing else. This is the listener the domain-driven version needed and no longer does;
  // clustering is the only reason left to track a level at all.
  useEffect(() => {
    if (!map) {
      return;
    }
    const listener = map.addListener('zoom_changed', () => {
      setZoom(map.getZoom() ?? 10);
    });
    return () => {
      listener.remove();
    };
  }, [map]);

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

  return null;
}
