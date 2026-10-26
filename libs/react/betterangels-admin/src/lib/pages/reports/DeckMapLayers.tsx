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
import { densityTileUrl, regionTileUrl } from '../../api/reports';
import { densityColor, type HeatPoint } from './heatmapMath';
import {
  buildClusterIndex,
  clusterRadius,
  clustersForZoom,
  type BBox,
  type Cluster,
  type ClusterIndex,
} from './clusterPoints';
import { clustersToBinary } from './deckData';
import { parseColor } from './mapColors';
import { isRefusalStatus } from './reportErrors';

/**
 * The map's layers, drawn by deck.gl.
 *
 * Density and boundaries are both `MVTLayer`s over endpoints on the API, and clustering is a
 * client-side binning of the point list. The density grid is aggregated by the server, so the
 * client holds one colour per cell it is showing rather than every interaction in the range.
 *
 * ## Why `GoogleMapsOverlay` rather than `<DeckGL>` wrapping `<Map>`
 *
 * The map is configured with `styles` (a stripped basemap) and no `mapId`, i.e. raster
 * rendering. `GoogleMapsOverlay` implements `OverlayView`/`WebGLOverlayView` and supports both
 * raster and vector maps, choosing the method at runtime. deck.gl documents that
 * `GoogleMapsOverlay` has no React integration of its own — it is imperative — so it is
 * constructed in an effect against the map from `useMap()`, which is the wrapper pattern
 * vis.gl documents.
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
 * The density grid is clipped exactly to its tile (buffer 0) so neighbouring cells meet edge to
 * edge; the boundary layer keeps a buffer so its lines stay continuous across tile seams. Both
 * are the server's choices (`regions.tiles`), and the client sets neither — it depends on them.
 */

/**
 * Design-system colours the layers paint with, resolved from antd tokens by the caller.
 *
 * One shape shared by `DeckMapLayers` and `RegionMap` rather than a structural copy in each:
 * the object is in the layer memo's dependency list, so the two must agree on every field.
 */
export type OverlayColors = {
  /** Region outlines, and the outline of a cluster bubble. */
  stroke: string;
  /** Cluster bubbles' fill. */
  markFill: string;
};

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
  /** One grid cell's ground area at the current zoom; turns a count into a density. */
  cellAreaKm2: number;
  /** The red end of the density ramp, the per-zoom p95 from `densityScale`. */
  densityMax: number;
  /**
   * The density tiles were **refused** — a 403 from the endpoint, which is an authority or
   * session answer rather than a fault. Reported up so the panel can say so; see `RegionMap`.
   *
   * This is not how a withheld *note scope* reaches the reader: that scope is a filter, so it
   * produces a 204 with no cells, and `interactionMap.withheld` is what reports it.
   */
  onDensityRefused?: () => void;
  /**
   * **Any** tile loaded, so whatever the last refusal or fault was about does not apply any
   * more.
   *
   * Both layers call it, and that is the point: a notice only a density tile could clear would
   * persist forever in the clusters view, where no density layer is built.
   */
  onTileLoaded?: () => void;
  /**
   * A tile failed for a reason that is **not** a refusal — a 500, a dropped connection, a tile
   * outside the server's zoom ceiling.
   *
   * Without this the map draws nothing and says nothing: an empty field under a legend that
   * promises a density reading looks like "no interactions here", which is the one thing a
   * failed tile must not be mistaken for.
   */
  onTileFault?: () => void;
  /** Design-system colours, resolved from antd tokens by the caller. */
  overlay: OverlayColors;
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
  const status =
    /fetch failed (\d{3})|Failed to fetch resource[^(]*\((\d{3})\)/.exec(
      message,
    );
  const code = Number(status?.[1] ?? status?.[2]);
  return isRefusalStatus(code);
}

export type BuildLayersArgs = {
  points: HeatPoint[];
  view: 'heatmap' | 'clusters';
  regionKind: string | null;
  focusCodes: string[];
  boundaryUrl: string | null;
  densityUrl: string | null;
  /** One grid cell's ground area at the current zoom; turns a count into a density. */
  cellAreaKm2: number;
  /** The red end of the density ramp, the per-zoom p95 from `densityScale`. */
  densityMax: number;
  /** Binned once per (points, zoom) by the caller; see `DeckMapLayers` below. */
  clusters: Cluster[];
  onDensityRefused?: () => void;
  onTileLoaded?: () => void;
  onTileFault?: () => void;
  overlay: OverlayColors;
};

/**
 * The deepest zoom the tile endpoints serve.
 *
 * Mirrors `MAX_ZOOM` in the backend's `regions/views.py`, which **rejects** a tile past its
 * ceiling rather than serving a clamped one — so if the server's value dropped while this stayed
 * put, the map would blank out at depth. `onTileFault` is what makes that a visible fault rather
 * than an empty field. One constant for both layers because the density grid and the boundaries
 * are drawn over each other and have to stop at the same depth.
 */
const TILE_MAX_ZOOM = 16;

/**
 * The layer stack, in draw order.
 *
 * Exported so its ordering and its accessors can be asserted without a WebGL context: this
 * environment has none, and both the layer order and the focus styling are behaviour that a
 * render would not catch.
 */
export function buildLayers({
  points,
  view,
  regionKind,
  focusCodes,
  boundaryUrl,
  densityUrl,
  cellAreaKm2,
  densityMax,
  onDensityRefused,
  onTileLoaded,
  onTileFault,
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
        maxZoom: TILE_MAX_ZOOM,
        filled: true,
        stroked: false,
        getFillColor: (feature) =>
          densityColor(
            Number((feature.properties as { count?: number })?.count ?? 0),
            cellAreaKm2,
            densityMax,
          ),
        pickable: false,
        // The one thing the grid cannot answer for itself: whether the note read scope
        // withheld it. `isRefusedTileError` separates a refusal from a fault, and a tile that
        // does load clears the notice again — so a single dropped connection cannot leave the
        // map replaced by a permission message for the rest of the session.
        onTileError: (error: unknown) => {
          if (isRefusedTileError(error)) {
            onDensityRefused?.();
            return;
          }
          onTileFault?.();
        },
        onTileLoad: () => onTileLoaded?.(),
      }),
    );
  }

  if (points.length > 0 && view === 'clusters') {
    layers.push(
      new ScatterplotLayer<Cluster>({
        id: 'interaction-clusters',
        // Position and radius baked into buffers. Radius comes from the count, so it is a
        // cheap function of data already in hand — no reason to run an accessor per cluster.
        data: clustersToBinary(clusters, clusterRadius),
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
        getPosition: (cluster: Cluster) => [
          cluster.longitude,
          cluster.latitude,
        ],
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

  // Pushed last so the strokes land **over** the density field. The field is opaque over the
  // area its data bounds, so boundaries drawn under it are painted over and the geography the
  // reader needs in order to place the density disappears. A frame belongs on top of what it
  // frames.
  if (regionKind && boundaryUrl) {
    layers.push(
      new MVTLayer({
        id: `region-boundaries-${regionKind}`,
        data: boundaryUrl,
        loadOptions: { fetch: { credentials: 'include' } },
        minZoom: 0,
        maxZoom: TILE_MAX_ZOOM,
        // Boundaries are public reference data with no note scope to refuse, so an error here is
        // a session or transport problem like any other. Both outcomes are reported the same
        // way, and `onTileLoad` on this same layer is what clears them — without it a boundary
        // tile that failed once would leave the notice up for the rest of the session, because
        // in the clusters view there is no density layer to report a successful load.
        onTileError: () => onTileFault?.(),
        onTileLoad: () => onTileLoaded?.(),
        // **Stroke only.** Filling each region with its interaction count would be a second
        // encoding of the quantity the density grid already encodes as a colour, competing for
        // the same pixels. Boundaries are the frame, not a second reading of the data; the
        // table beside the map carries the per-region counts.
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

/** The map's viewport, in the shape the cluster query takes. */
type Viewport = {
  zoom: number;
  /** `[west, south, east, north]`, or `null` before the map reports bounds. */
  bounds: BBox | null;
};

/** `supercluster` wants `[west, south, east, north]`; `LatLngBounds` gives corners. */
function readViewport(map: google.maps.Map): Viewport {
  const bounds = map.getBounds();
  if (!bounds) {
    return { zoom: map.getZoom() ?? 0, bounds: null };
  }
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return {
    zoom: map.getZoom() ?? 0,
    bounds: [
      southWest.lng(),
      southWest.lat(),
      northEast.lng(),
      northEast.lat(),
    ],
  };
}

function sameBounds(a: BBox | null, b: BBox | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.every((value, index) => value === b[index]);
}

/** Equality, so a settled map does not hand the layer memo a new viewport object. */
function sameViewport(a: Viewport, b: Viewport): boolean {
  return a.zoom === b.zoom && sameBounds(a.bounds, b.bounds);
}

export function DeckMapLayers({
  points,
  view,
  regionKind,
  focusCodes,
  organizationId,
  startDate,
  endDate,
  cellAreaKm2,
  densityMax,
  onDensityRefused,
  onTileLoaded,
  onTileFault,
  overlay,
}: DeckMapLayersProps) {
  const map = useMap();

  /**
   * The clustering tree for `points`, built in an effect rather than during render.
   *
   * `buildClusterIndex` runs `index.load()` over every point synchronously — measured at
   * ~25 ms for 5,000 — and the points that need it arrive in the same render that first draws
   * the clusters view, so building during render spends that frame's paint budget on it. As
   * state it costs one frame with no bubbles instead. The points it was built from travel with
   * it, so a tree is never drawn against a different point list while the next one is building.
   */
  const [clusterIndex, setClusterIndex] = useState<{
    points: HeatPoint[];
    index: ClusterIndex;
  } | null>(null);

  useEffect(() => {
    if (view !== 'clusters') {
      return;
    }
    // Deferred a tick so the map paints first, and so StrictMode's double-invoke cancels the
    // first build rather than paying for the synchronous load twice.
    const handle = window.setTimeout(() => {
      setClusterIndex({ points, index: buildClusterIndex(points) });
    }, 0);
    return () => window.clearTimeout(handle);
  }, [points, view]);

  const { apiUrl } = useApiConfig();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  /** The map instance the overlay is currently attached to, so a layers change does not re-attach. */
  const attachedMapRef = useRef<google.maps.Map | null>(null);
  /** Pending deferred teardown, so a re-mount can cancel it; see the effect below. */
  const teardownRef = useRef<number | null>(null);

  // Endpoint spellings live in `api/reports`; the template is absolute for deck.gl.
  let boundaryUrl: string | null = null;
  if (regionKind) {
    boundaryUrl = regionTileUrl(apiUrl, regionKind);
  }

  // Only a region drill-down travels: a bare grouping must not change the URL, or every
  // group-by refetches identical tiles. `densityTileUrl` sorts the codes for the same cache.
  const densityUrl = useMemo(() => {
    if (!organizationId || !startDate || !endDate) {
      return null;
    }
    return densityTileUrl({
      apiUrl,
      organizationId,
      startDate,
      endDate,
      dimension: regionKind ?? undefined,
      codes: focusCodes,
    });
  }, [apiUrl, organizationId, startDate, endDate, regionKind, focusCodes]);

  /**
   * The viewport the cluster bins are cut against, in state so the layer memo sees it.
   *
   * `supercluster`'s tree decides membership and counts; the viewport only narrows what is
   * returned, which is what keeps a high zoom from handing the layers one entry per point.
   * Seeded from the map rather than from a constant, so the first bin is cut at the level the
   * map actually opens at.
   */
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    if (!map || view !== 'clusters') {
      return;
    }
    const sync = () => {
      const next = readViewport(map);
      setViewport((previous) =>
        previous && sameViewport(previous, next) ? previous : next,
      );
    };
    sync();
    // `zoomend`, not `zoom_changed`: the latter fires on every step of a zoom animation, and
    // each tick would re-bin and rebuild the layer stack. `idle` covers the pan, which matters
    // because a viewport-narrowed query has to be asked again once the box moves.
    const listeners = [
      map.addListener('zoomend', sync),
      map.addListener('idle', sync),
    ];
    return () => {
      for (const listener of listeners) {
        listener.remove();
      }
    };
    // `view` is a dependency because the viewport only matters to the cluster bins: with the
    // density grid showing, a zoom would re-render this subtree and rebuild a layer stack that
    // cannot have changed.
  }, [map, view]);

  const clusters = useMemo(() => {
    if (view !== 'clusters' || viewport === null) {
      return NO_CLUSTERS;
    }
    // Only the tree for the points in hand; until the effect above has built it, the view
    // draws no bubbles rather than the previous dataset's.
    if (clusterIndex === null || clusterIndex.points !== points) {
      return NO_CLUSTERS;
    }
    return clustersForZoom(clusterIndex.index, viewport.zoom, viewport.bounds);
  }, [clusterIndex, points, viewport, view]);

  // Stable, so the layer memo is not invalidated by a new closure on every render.
  const handleDensityRefused = useCallback(
    () => onDensityRefused?.(),
    [onDensityRefused],
  );
  const handleTilesLoaded = useCallback(() => onTileLoaded?.(), [onTileLoaded]);
  const handleTileFault = useCallback(() => onTileFault?.(), [onTileFault]);

  const layers = useMemo(
    () =>
      buildLayers({
        points,
        view,
        regionKind,
        focusCodes,
        boundaryUrl,
        densityUrl,
        cellAreaKm2,
        densityMax,
        onDensityRefused: handleDensityRefused,
        onTileLoaded: handleTilesLoaded,
        onTileFault: handleTileFault,
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
      cellAreaKm2,
      densityMax,
      handleDensityRefused,
      handleTilesLoaded,
      handleTileFault,
      overlay,
      clusters,
    ],
  );

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
    } else {
      overlayRef.current.setProps({ layers });
    }
    // Re-attach only when the map itself is a different instance. The teardown effect is keyed
    // on `map` precisely because a replacement is possible, and an overlay left on the old one
    // draws nothing — the `else` branch above alone would leave it there. Guarded by a ref so a
    // layers change does not re-register the overlay's map listeners on every render.
    if (attachedMapRef.current !== map) {
      overlayRef.current.setMap(map);
      attachedMapRef.current = map;
    }
  }, [map, layers]);

  /**
   * Teardown, **deferred by a tick and cancelled by a re-mount**.
   *
   * The constraint is not optional: deck.gl sizes and draws its canvas inside Google's
   * `OverlayView.draw()`, which the map only calls when it redraws itself, so an overlay that
   * is detached and then re-attached while the map is already idle can be left with a canvas
   * nothing ever draws. Deferring the teardown to the next tick lets the re-mount that follows
   * it in the same tick cancel the timer, so the overlay that already has a drawn canvas
   * survives; a real unmount has no re-mount to cancel it and still releases the WebGL context.
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
        attachedMapRef.current = null;
        teardownRef.current = null;
      }, 0);
    };
  }, [map]);

  return null;
}
