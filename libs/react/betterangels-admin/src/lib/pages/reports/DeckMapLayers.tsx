import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
// The package's only exported entry re-exports Tile3DLayer, which imports
// @deck.gl/mesh-layers at module scope — so that peer has to be installed even though no 3D
// layer is used. It is a resolution requirement, not a runtime one; tree-shaking keeps it
// out of the build.
import { MVTLayer } from '@deck.gl/geo-layers';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import type { Layer } from '@deck.gl/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useApiConfig } from '@monorepo/ba-platform';
import { densityColor, type HeatPoint } from './heatmapMath';
import {
  buildClusterIndex,
  clusterRadius,
  clustersForZoom,
  type Cluster,
} from './clusterPoints';
import { clustersToBinary } from './deckData';
import { parseColor } from './mapColors';

/**
 * The map's layers, drawn by deck.gl.
 *
 * Density and boundaries are both `MVTLayer`s over endpoints on the API, and clustering is a
 * client-side binning of the point list. Density used to be a `HeatmapLayer` fed every
 * individual interaction — 10,000 points, about 1 MB — which is why it is now a tile: the
 * server aggregates the points into a grid and the client fetches only the cells in view.
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

const hexToRgba = (color: string, alpha: number): RgbaTuple => {
  const [r, g, b] = parseColor(color);
  return [r, g, b, Math.round(alpha * 255)];
};

/**
 * The density endpoint's tile encoding, recorded here even though none of it is a deck.gl
 * prop — deck.gl has no tile-buffer option and the extent is the MVT spec's, so there is
 * nothing on this side to set. It is written down because it is what the server chose and
 * what the client's rendering depends on:
 *
 * * **extent 4096** (`regions.tiles.TILE_EXTENT`), which the MVT loader reads from the layer
 *   to normalise the geometry.
 * * **buffer 0** (`regions.tiles.DENSITY_TILE_BUFFER`): cells are clipped exactly to the tile
 *   so neighbours meet edge to edge. The boundary layer uses 64, for line continuity, which a
 *   grid must not do — an overlap would draw one cell's count over its neighbour's.
 */

export type DeckMapLayersProps = {
  /** Interaction locations. Only the clusters view reads them. */
  points: HeatPoint[];
  /** Which of the two point renderings to draw. */
  view: 'heatmap' | 'clusters';
  /** Dimension whose boundaries to draw, or `null` when nothing is grouped. */
  regionKind: string | null;
  /** Regions the reader has drilled into. Empty means every region is in scope. */
  focusCodes: string[];
  /** The org whose interactions the density grid covers. The endpoint requires it. */
  organizationId: string;
  /** The report window, as `YYYY-MM-DD`, so the grid matches the table beside it. */
  startDate: string;
  endDate: string;
  /**
   * The density tiles were **refused**, which is a permission answer rather than a fault —
   * the note read scope is a different permission from the report scope, so a reader can be
   * entitled to the breakdown and not to the interactions. Reported up so the panel can say
   * so; see `RegionMap`.
   */
  onDensityRefused?: () => void;
  /**
   * A density tile loaded, so whatever the last refusal was about does not apply any more.
   *
   * The pair is what keeps a single transient tile failure from replacing the map with a
   * permission notice for the rest of the session: a refusal is only *shown* while tiles are
   * actually being refused.
   */
  onDensityLoaded?: () => void;
  /** Design-system colours, resolved from antd tokens by the caller. */
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
};

/**
 * Whether a tile error is a **refusal** rather than a fault.
 *
 * The status is read out of the two shapes loaders.gl puts it in — `fetch failed 403 Forbidden`
 * (`check-errors`) and `Failed to fetch resource (403) Forbidden: <url>`
 * (`fetch-error-message`) — rather than by looking for the digits anywhere in the string. The
 * second is the one this endpoint actually produces, **captured from the browser** rather than
 * assumed: the status sits immediately after "resource", and the URL comes *after* it, so a
 * pattern expecting the URL before the status silently matches nothing.
 *
 * The distinction is the whole point of the function: the error carries the tile URL, and a
 * tile at `…/density/8/403/101.mvt` that failed for an unrelated reason — a dropped
 * connection, an aborted body — must not be reported as "your role cannot see this" and blank
 * the map. A named function so that mistake is a failing test rather than a comment.
 */
export function isRefusedTileError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  const status = /fetch failed (\d{3})|Failed to fetch resource[^(]*\((\d{3})\)/.exec(message);
  const code = Number(status?.[1] ?? status?.[2]);
  return code === 401 || code === 403;
}

type BuildLayersArgs = {
  points: HeatPoint[];
  view: 'heatmap' | 'clusters';
  regionKind: string | null;
  focusCodes: string[];
  boundaryUrl: string | null;
  densityUrl: string | null;
  /** Binned once per (points, zoom) by the caller; see `useClusters` below. */
  clusters: Cluster[];
  onDensityRefused?: () => void;
  onDensityLoaded?: () => void;
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
 */
function buildLayers({
  points,
  view,
  regionKind,
  focusCodes,
  boundaryUrl,
  densityUrl,
  onDensityRefused,
  onDensityLoaded,
  overlay,
  clusters,
}: BuildLayersArgs): Layer[] {
  const layers: Layer[] = [];

  // **Density first, so it is underneath.** The boundary strokes are pushed last and belong
  // over the field they frame; a filled grid drawn after them would hide the geography.
  if (view === 'heatmap' && densityUrl) {
    layers.push(
      new MVTLayer({
        id: 'interaction-density',
        // deck.gl caches tiles by URL, which is what makes the query parameters safe: a new
        // date range or a new set of region codes is a new URL, and a new URL is a refetch.
        data: densityUrl,
        // The session cookie is what the endpoint authorizes on, and the API is on another
        // origin in development. Without this the tiles arrive as anonymous 403s.
        loadOptions: { fetch: { credentials: 'include' } },
        minZoom: 0,
        maxZoom: 16,
        filled: true,
        stroked: false,
        getFillColor: (feature) =>
          densityColor(
            Number((feature.properties as { count?: number })?.count ?? 0),
          ),
        pickable: false,
        // The one thing the grid cannot answer for itself: whether the note read scope
        // withheld it. `isRefusedTileError` separates a refusal from a fault, and a tile that
        // does load clears the notice again — so a single dropped connection cannot leave the
        // map replaced by a permission message for the rest of the session.
        onTileError: (error: unknown) => {
          if (isRefusedTileError(error)) {
            onDensityRefused?.();
          }
        },
        onTileLoad: () => onDensityLoaded?.(),
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
  // The field is opaque over the area its data bounds. Drawn after the boundaries — which is
  // what array order used to do — it painted straight over the outlines, so the geography the
  // reader needs to place the density was hidden by the density itself. A frame belongs on
  // top of what it frames.
  if (regionKind && boundaryUrl) {
    layers.push(
      new MVTLayer({
        id: `region-boundaries-${regionKind}`,
        data: boundaryUrl,
        loadOptions: { fetch: { credentials: 'include' } },
        minZoom: 0,
        maxZoom: 16,
        // **Stroke only.** The fill used to encode each region's interaction count as a colour
        // and an alpha, which is the same quantity the density grid already encodes as a
        // colour — two encodings of "where are the interactions", competing for the same
        // pixels. The reader saw grey districts and no density. Boundaries are the frame, not a
        // second reading of the data; the table beside the map carries the per-region counts.
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
  organizationId,
  startDate,
  endDate,
  onDensityRefused,
  onDensityLoaded,
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
    // Only queried when the view that draws them is showing: the density grid has no use for
    // them, and nothing else on the page does either.
    () => (view === 'clusters' ? clustersForZoom(clusterIndex, zoom) : NO_CLUSTERS),
    [clusterIndex, zoom, view],
  );
  const { apiUrl } = useApiConfig();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  //: Pending deferred teardown, so a re-mount can cancel it; see the effect below.
  const teardownRef = useRef<number | null>(null);

  // Absolute because deck.gl's TileLayer fetches the template directly; a relative template
  // would resolve against the page origin rather than the API's.
  // Lowercased: `RegionDimension` spells the dimension uppercase (`COUNCIL_DISTRICT`) and the
  // endpoint matches the wire `kind`, which is lowercase. Sending the enum as-is made every
  // tile 404 — measured, `COUNCIL_DISTRICT/8/43/102` 404 against `council_district/8/43/102`
  // 200 with 4.4 kB of geometry — so the boundary layer drew nothing at all.
  const boundaryUrl = regionKind
    ? `${apiUrl}/regions/tiles/${regionKind.toLowerCase()}/{z}/{x}/{y}.mvt`
    : null;

  // The density grid's own query string. It carries the org, the window and — only when the
  // reader has drilled into regions — the dimension and the codes, which is exactly the
  // variable set `interactionMap` is given. A *grouping* with nothing selected deliberately
  // does not appear: a group-by re-partitions the same interactions rather than selecting
  // different ones, so it must not move the field, and sending it would change the URL and
  // refetch identical tiles on every group-by.
  const densityUrl = useMemo(() => {
    if (!organizationId || !startDate || !endDate) {
      return null;
    }
    const params = new URLSearchParams({
      organizationId,
      start: startDate,
      end: endDate,
    });
    if (regionKind && focusCodes.length > 0) {
      params.set('dimension', regionKind.toLowerCase());
      for (const code of focusCodes) {
        params.append('codes', code);
      }
    }
    return `${apiUrl}/regions/tiles/density/{z}/{x}/{y}.mvt?${params.toString()}`;
  }, [apiUrl, organizationId, startDate, endDate, regionKind, focusCodes]);

  // Stable, so the layer memo is not invalidated by a new closure on every render.
  const handleDensityRefused = useCallback(
    () => onDensityRefused?.(),
    [onDensityRefused],
  );
  const handleDensityLoaded = useCallback(
    () => onDensityLoaded?.(),
    [onDensityLoaded],
  );

  const layers = useMemo(
    () =>
      buildLayers({
        points,
        view,
        regionKind,
        focusCodes,
        boundaryUrl,
        densityUrl,
        onDensityRefused: handleDensityRefused,
        onDensityLoaded: handleDensityLoaded,
        overlay,
        clusters,
      }),
    [
      points,
      view,
      regionKind,
      focusCodes,
      boundaryUrl,
      densityUrl,
      handleDensityRefused,
      handleDensityLoaded,
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
    // density grid showing, a zoom would re-render this subtree and rebuild a layer stack that
    // cannot have changed.
  }, [map, view]);

  // One overlay per map, reused across renders. deck.gl diffs the layer array itself, so the
  // overlay is created once and updated with `setProps` — recreating it would throw away the
  // WebGL context on every render.
  useEffect(() => {
    if (!map) {
      return;
    }
    // A re-run cancels a teardown that the *other* effect scheduled; see below.
    if (teardownRef.current !== null) {
      window.clearTimeout(teardownRef.current);
      teardownRef.current = null;
    }
    if (!overlayRef.current) {
      overlayRef.current = new GoogleMapsOverlay({ layers });
      overlayRef.current.setMap(map);
    } else {
      overlayRef.current.setProps({ layers });
    }
  }, [map, layers]);

  /**
   * Teardown, **deferred by a tick and cancelled by a re-mount**.
   *
   * On a raster map deck.gl sizes and draws its canvas inside Google's `OverlayView.draw()`,
   * and Google only calls that when the map itself redraws. An overlay attached while the map
   * is already idle therefore fetches its tiles and paints nothing — measured on the dev
   * server: the deck canvas stays 1×1, four density tiles arrive with 200s, and nothing
   * appears until the reader scrolls or moves the map.
   *
   * That is the normal case in development, where React's `StrictMode` mounts every effect,
   * tears it down and mounts it again: an immediate teardown detaches the overlay whose canvas
   * *was* drawn, and its replacement is attached after the map has gone idle. Deferring the
   * teardown to the next tick lets the re-mount cancel it, so the overlay that already has a
   * drawn canvas survives the double-invoke. A real unmount has no re-mount to cancel it and
   * still releases the WebGL context.
   *
   * (`google.maps.event.trigger(map, 'resize')` does not help here: `trigger` only calls the
   * listeners registered for the event, it does not resize or redraw anything.)
   */
  useEffect(() => {
    if (!map) {
      return;
    }
    return () => {
      teardownRef.current = window.setTimeout(() => {
        overlayRef.current?.setMap(null);
        overlayRef.current?.finalize();
        overlayRef.current = null;
        teardownRef.current = null;
      }, 0);
    };
  }, [map]);

  return null;
}
