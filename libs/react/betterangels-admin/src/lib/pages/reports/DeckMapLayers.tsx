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
import {
  buildClusterIndex,
  clusterRadius,
  clustersForZoom,
  type Cluster,
} from './clusterPoints';
import { clustersToBinary } from './deckData';
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

/** Shared empty result, so "no clusters" keeps one identity instead of a new array each time. */
const NO_CLUSTERS: Cluster[] = [];

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
  /** Regions the reader has drilled into. Empty means every region is in scope. */
  focusCodes: string[];
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
  focusCodes: string[];
  tileUrl: string | null;
  /** Binned once per (points, zoom) by the caller; see `useClusters` below. */
  clusters: Cluster[];
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
};

/**
 * One definition of the layer stack.

 */
function buildLayers({
  points,
  view,
  regionKind,
  focusCodes,
  tileUrl,
  overlay,
  clusters,
}: BuildLayersArgs): Layer[] {
  const layers: Layer[] = [];

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
    layers.push(
      new ScatterplotLayer<Cluster>({
        id: 'interaction-clusters',
        // Position and radius baked into buffers. Radius comes from the count, so it is a
        // cheap function of data already in hand — no reason to run an accessor per cluster.
        data: clustersToBinary(clusters, clusterRadius) as never,
        positionFormat: 'XY',
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

  // Pushed last so the strokes land **over** the density field.
  //
  // The heatmap is a triangle mesh covering its data's bounding box, and inside that box it
  // is opaque. Drawn after the boundaries — which is what array order used to do — it painted
  // straight over the outlines, so the geography the reader needs to place the density was
  // hidden by the density itself. A frame belongs on top of what it frames.
  if (regionKind && tileUrl) {
    layers.push(
      new MVTLayer({
        id: `region-boundaries-${regionKind}`,
        data: tileUrl,
        loadOptions: { fetch: { credentials: 'include' } },
        minZoom: 0,
        maxZoom: 16,
        // **Stroke only.** The fill used to encode each region's interaction count as a colour
        // and an alpha, which is the same quantity the heatmap already encodes as a colour —
        // two encodings of "where are the interactions", competing for the same pixels. The
        // reader saw grey districts and no density. Boundaries are the frame, not a second
        // reading of the data; the table beside the map carries the per-region counts.
        filled: false,
        stroked: true,
        getLineColor: (feature) => {
          const code = String(
            (feature.properties as { code?: string })?.code ?? '',
          );
          // Everything stays drawn when a region is selected, with the chosen ones emphasised.
          // A single district floating with nothing around it loses the geography that makes it
          // locatable.
          const faded = focusCodes.length > 0 && !focusCodes.includes(code);
          return hexToRgba(overlay.stroke, faded ? 0.25 : 0.9);
        },
        getLineWidth: (feature) => {
          const code = String(
            (feature.properties as { code?: string })?.code ?? '',
          );
          return focusCodes.includes(code) ? 2.4 : 1.2;
        },
        lineWidthUnits: 'pixels',
        pickable: false,
        updateTriggers: {
          getLineColor: [overlay.stroke, focusCodes],
          getLineWidth: [focusCodes],
        },
      }),
    );
  }

  return layers;
}

export function DeckMapLayers({
  points,
  view,
  regionKind,
  focusCodes,
  overlay,
}: DeckMapLayersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState<number>(10);
  // Binning is the expensive part of the cluster view, so it is done once per (points, zoom)
  // rather than inside every layer rebuild.
  // The tree is built once per dataset — it is a property of the data, and building it is the
  // expensive half. The per-zoom query against it is sub-millisecond.
  const clusterIndex = useMemo(() => buildClusterIndex(points), [points]);
  const clusters = useMemo(
    // Only queried when the view that draws them is showing: the heatmap has no use for them.
    () => (view === 'clusters' ? clustersForZoom(clusterIndex, zoom) : NO_CLUSTERS),
    [clusterIndex, zoom, view],
  );
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
        focusCodes,
        tileUrl,
        overlay,
        clusters,
      }),
    [
      points,
      view,
      regionKind,
      focusCodes,
      tileUrl,
      overlay,
      clusters,
    ],
  );

  // The cluster bins are cut in screen space, so they are a function of the zoom level and
  // nothing else. This is the listener the domain-driven version needed and no longer does;
  // clustering is the only reason left to track a level at all.
  useEffect(() => {
    if (!map || view !== 'clusters') {
      return;
    }
    setZoom(map.getZoom() ?? 10);
    const listener = map.addListener('zoom_changed', () => {
      setZoom(map.getZoom() ?? 10);
    });
    return () => {
      listener.remove();
    };
    // `view` is a dependency because the level only matters to the cluster bins: with the
    // heatmap showing, a zoom would re-render this subtree and rebuild a layer stack that
    // cannot have changed.
  }, [map, view]);

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
