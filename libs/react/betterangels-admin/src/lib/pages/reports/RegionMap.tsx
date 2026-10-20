/// <reference types="google.maps" />
import { Alert, theme } from 'antd';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  Map as GoogleMap,
  type MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { LA_COUNTY_CENTER } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { DeckMapLayers, type OverlayColors } from './DeckMapLayers';
import {
  DENSITY_PER_KM2_MAX,
  HEATMAP_RAMP_CSS,
  densityCellAreaKm2,
  densityCellSideMeters,
} from './heatmapMath';
import { useDensityScale, type InteractionPointType } from './hooks';
import { mapNotice } from './mapNotice';
import { GENERIC_ERROR_MESSAGE } from './reportErrors';

/** Stable identity for the ungrouped map, so its layers are not rebuilt on every render. */
const EMPTY_FOCUS: string[] = [];

/**
 * The map's home view: LA County, fitted to the county rather than to one address.
 *
 * The **centre** comes from the shared map module (`LA_COUNTY_CENTER`, re-exported from
 * `@monorepo/react/components`) so this map and the shelter maps agree on where LA is; it is
 * converted from the shared `{ latitude, longitude }` shape to the
 * `{ lat, lng }` literal `@vis.gl/react-google-maps` wants.
 *
 * The **zoom** is deliberately local. `DEFAULT_MAP_ZOOM` (13) is the shared default for a map
 * centred on a single location; this map is a county-wide analytical surface, and 13 shows a
 * few neighbourhoods of it. 9 frames the county, which is the scale the six dimensions are
 * read at.
 */
const LA_CENTER: google.maps.LatLngLiteral = {
  lat: LA_COUNTY_CENTER.latitude,
  lng: LA_COUNTY_CENTER.longitude,
};

/**
 * Strip the basemap back to what the data needs.
 *
 * Under a density field every business pin, restaurant label and attraction icon is noise
 * competing with the field being read, and it is worst exactly where the data is densest —
 * central LA — where the clutter and the data overlap.
 *
 * What stays is what orients the reader: roads, water, city and neighbourhood names, and
 * administrative boundaries. `poi` goes entirely, including `poi.park`, because park
 * labels ("Griffith Park") are still labels on a field rather than part of the
 * measurement. Transit is removed for the same reason: a metro station icon is a landmark,
 * not an interaction.
 *
 * Applied as a static style rather than a cloud-styled map ID. A `mapId` would take
 * precedence and make this array a no-op, and the map has no `mapId` — this is raster, so
 * `styles` applies.
 */
const DATA_FOCUSED_STYLES: google.maps.MapTypeStyle[] = [
  // Everything the reader is not measuring.
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  // The green "Mt San Antonio" badge survives the `poi` rule because it is a *terrain*
  // label, not a point of interest — it lives under `landscape.natural`. Terrain names are
  // orientation at the scale of a whole county, which this map is never read at.
  {
    featureType: 'landscape.natural',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  // Icons and shields multiply the noise on their own, even where labels are useful.
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  // Softened so the basemap sits behind the density field instead of beside it.
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ saturation: -40 }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ saturation: -60 }, { lightness: 15 }],
  },
];
const LA_ZOOM = 9;

/**
 * The density tile zoom at the home view.
 *
 * deck.gl tiles are 512px and Google's are 256px, so map zoom 9 fetches **z8** tiles (the same
 * relationship the tile URL comments record). The cell area in the legend starts here and
 * follows the map's camera.
 */
const INITIAL_TILE_ZOOM = Math.max(0, Math.floor(LA_ZOOM) - 1);

/**
 * Overlay colours from the design system.
 *
 * Read through `useToken` rather than importing hexes, so a theme change flows through. The
 * shape itself is `OverlayColors` in `DeckMapLayers`, so the map and the layers cannot drift
 * apart field by field.
 */
function useMapColors(): OverlayColors {
  const { token } = theme.useToken();
  const { colorText, colorError } = token;
  // Memoised on the token values, not returned as a fresh literal: the result is in the layer
  // memo's dependency list, so a new object identity on every render rebuilt the whole deck.gl
  // layer stack — including re-binning the clusters over every point — for a render that
  // changed nothing the map can see.
  return useMemo(
    () => ({
      // antd's neutral palette is defined to meet contrast on light and dark backgrounds, so
      // the overlay stays legible over raster tiles.
      stroke: colorText,
      // The cluster marks use the error red: the palette's warm accent, and the one hue that
      // reads against the basemap's greens and blues.
      markFill: colorError,
    }),
    [colorText, colorError],
  );
}

/**
 * The density grid's colour key.
 *
 * A sibling of the map rather than one of its children: the map wrapper is presentational to
 * assistive technology, and this legend is the only key to the colour scale, so it has to stay
 * in the accessibility tree.
 *
 * Drawn over the map because the ramp is meaningless without knowing what it measures, and a
 * reader looking at a gradient should not have to hunt for its key. Bottom-left, lifted clear
 * of Google's own attribution, which owns that corner and must stay readable — it is a licence
 * term, not decoration.
 */
function DensityLegend({
  cellSideM,
  densityMax,
  relative,
}: {
  cellSideM: number;
  densityMax: number;
  relative: boolean;
}) {
  const cellLabel =
    cellSideM >= 1000
      ? `${(cellSideM / 1000).toFixed(1)} km`
      : `${Math.round(cellSideM)} m`;
  // The ramp's midpoint is a quarter of its red end on the square-root scale.
  const middle = Math.max(1, Math.round(densityMax / 4));
  const high = Math.max(1, Math.round(densityMax));

  return (
    <div className="pointer-events-none absolute bottom-9 left-3 z-[5] rounded bg-white/90 px-2 py-1 shadow">
      {/* 12px is the floor for legible secondary text, and #8c8c8c on white is only 3.36:1
          against a 4.5:1 requirement. These use the 12px/`neutral-700` pairing, which measures
          10.7:1 — the legend is the only key to the colour scale, so leaving it at the least
          readable size on the page was backwards. */}
      <div className="mb-0.5 text-xs font-medium text-neutral-700">
        Interactions per km²
      </div>
      <div className="mb-1 text-xs leading-tight text-neutral-600">
        {relative ? 'Relative to this zoom' : 'Fixed scale'}
      </div>
      <div
        className="h-2 w-44 rounded-sm"
        style={{ background: HEATMAP_RAMP_CSS }}
      />
      {/* The domain is the p95 of the non-empty cells at this zoom, so the top label moves
          when the cell size moves; the "relative" line above is what makes that honest. */}
      <div className="mt-0.5 flex w-44 justify-between text-xs text-neutral-700">
        <span>0</span>
        <span>{middle}</span>
        <span>{high}+</span>
      </div>
      <div className="mt-0.5 w-44 text-xs text-neutral-700">
        Each square ≈ {cellLabel} across
      </div>
    </div>
  );
}

/** The map's views. Density is the default; see `RegionMap` below. */
export type MapView = 'heatmap' | 'clusters';

type RegionMapProps = {
  /** Absent when the report is not grouped by geography; then no polygons are drawn. */
  dimension?: RegionDimension;
  /**
   * Individual interaction locations, from `interactionMap`.
   *
   * Only the clusters view draws them. The density view asks `interactionScope` instead,
   * because it needs the one flag those points would carry and draws none of them: the tile
   * endpoint answers 204 for "nothing here" and for "withheld" alike.
   */
  points?: InteractionPointType[];
  /** The point query is in flight and has not answered yet. */
  pointsLoading?: boolean;
  /** True when the point cap was reached and the clusters are a subset. */
  truncated?: boolean;
  /** Names of the regions the map is narrowed to, if any. */
  filteredTo?: string;
  /** Region codes the reader narrowed to; the viewport frames these. */
  focusCodes?: string[];
  /** The app owns the key; the lib only needs to know whether one exists. */
  hasMapsKey?: boolean;
  /**
   * The reader's role **withheld** the interactions — either the point query was refused
   * outright, or the API answered with an empty pinned set and `withheld` set, which is the
   * note read scope removing every pin. Both mean the same thing to the reader, so both get the
   * permission notice, in place, rather than thrown: the rollup beside it is a separate query
   * that succeeded, so the panel must not be replaced.
   *
   * Without the second case an empty payload reads as "0 interactions" — a claim about the
   * neighbourhood that the client is in no position to make. See `LocationBreakdown`.
   */
  refused?: boolean;
  /**
   * The point query **failed** for a reason that is not a refusal — a 500, an offline browser,
   * a validation error. A fault, so it says so rather than diagnosing a missing permission.
   * The boundaries and the table stay useful without pins.
   */
  failed?: boolean;
  /** Which rendering of the same data to draw. */
  view?: MapView;
  /** The org whose interactions the density grid covers. */
  organizationId: string;
  /** The report window, as `YYYY-MM-DD`, so the grid matches the table beneath it. */
  startDate: string;
  endDate: string;
  /** Map height in pixels; the split layout gives it less than the full-width one. */
  height?: number;
  /**
   * The map is near the viewport. The density scale query is a full-window aggregate, so it
   * waits like the point query does rather than running for a panel below the fold.
   */
  visible?: boolean;
  className?: string;
};

/**
 * Interactions by region, drawn on a map.
 *
 * The density grid arrives as vector tiles from the API, so the client holds the counts in
 * view rather than every interaction. The clusters view still plots individual points, which
 * is the only thing `interactionMap` is for.
 */
export function RegionMap({
  dimension,
  points = [],
  pointsLoading = false,
  truncated = false,
  filteredTo,
  focusCodes = EMPTY_FOCUS,
  hasMapsKey = true,
  refused = false,
  failed = false,
  view = 'heatmap',
  organizationId,
  startDate,
  endDate,
  height = 560,
  visible = true,
  className = '',
}: RegionMapProps) {
  const mapColors = useMapColors();

  /**
   * A density tile came back **refused** — a 403 from the tile endpoint rather than a failed
   * one. That is an authority or session problem, not the note read scope: the note scope is a
   * filter, so a reader it excludes gets a 204 with no cells, and `interactionMap` is what
   * reports that as `withheld` (in both views; see `LocationBreakdown`).
   *
   * Cleared whenever the question changes, because a refusal for the last date range is not an
   * answer about this one.
   */
  const [densityRefused, setDensityRefused] = useState(false);
  const [tileFaulted, setTileFaulted] = useState(false);
  // The density tiles the camera is asking for; the cell area follows it so the legend and the
  // colour scale describe the cells actually on screen.
  const [tileZoom, setTileZoom] = useState(INITIAL_TILE_ZOOM);
  // The caption below the map is its accessible description; `role="img"` gives what it draws a
  // name, and this points at the sentence that says what the picture means.
  const captionId = useId();
  useEffect(() => {
    setDensityRefused(false);
    // A tile fault is about the tiles of *that* question too: a new range or grouping is a new
    // URL and a new fetch, so it starts with no fault held against it.
    setTileFaulted(false);
    // `focusCodes` is state held by the caller, so its identity is the selection.
  }, [organizationId, startDate, endDate, dimension, focusCodes, view]);

  // Stable identities: these are in the layer memo's dependency list, and a new closure per
  // render would rebuild the whole deck.gl stack — and refetch the tiles — on every render.
  const markDensityRefused = useCallback(() => setDensityRefused(true), []);
  // Any tile that loads clears both notices: it is the same evidence the refusal's clear uses,
  // and one transient failure must not outlive the next successful fetch. Both layers report
  // this, so a boundary tile recovering is enough — the alternative is a fault that only a
  // density tile could clear, which is unreachable in the clusters view, where no density layer
  // is built at all.
  const handleTilesLoaded = useCallback(() => {
    setDensityRefused(false);
    setTileFaulted(false);
  }, []);
  const markTileFault = useCallback(() => setTileFaulted(true), []);

  // Only an integer tile-zoom change matters: panning inside a zoom keeps the same cell area,
  // so the colours do not move. The state update is skipped when the tile zoom is unchanged.
  const handleCameraChanged = useCallback((event: MapCameraChangedEvent) => {
    const next = Math.max(0, Math.floor(event.detail.zoom) - 1);
    setTileZoom((previous) => (previous === next ? previous : next));
  }, []);

  const cellSideM = densityCellSideMeters(tileZoom, LA_CENTER.lat);
  const cellAreaKm2 = densityCellAreaKm2(tileZoom, LA_CENTER.lat);

  // The scale is computed over the same population as the heatmap: a dimension alone leaves
  // the map county-wide, so only specific region codes narrow it.
  const { scale: densityScale, loading: scaleLoading } = useDensityScale({
    organizationId,
    startDate,
    endDate,
    zoom: tileZoom,
    dimension: focusCodes.length > 0 ? dimension : undefined,
    regionCodes: focusCodes.length > 0 ? focusCodes : undefined,
    // The map is replaced by a notice without a key or when the scope refused the data; the
    // domain would colour nothing.
    enabled: view === 'heatmap' && hasMapsKey && !refused && visible,
  });
  const hasDensityScale = densityScale !== null;
  const densityMax =
    densityScale && Number.isFinite(densityScale.p95) && densityScale.p95 > 0
      ? densityScale.p95 / cellAreaKm2
      : DENSITY_PER_KM2_MAX;

  const caption = useMemo(() => {
    let scope = '';
    if (filteredTo) {
      scope = ` within ${filteredTo}`;
    }
    if (view === 'clusters') {
      // A counted caption only once there is a count. The points are the largest payload on the
      // page and arrive after the map is placed, so asserting `0 interactions` on the way there
      // states a fact the client does not have.
      if (pointsLoading && points.length === 0) {
        return `Loading interaction locations${scope}...`;
      }
      // A dot stands for one *or more* interactions: points in the same screen cell are merged
      // into one bubble. This count is the number of points the client holds, which is exactly
      // what this view plots. Stated rather than instructed: the caption is the map's accessible
      // description, and `role="img"` makes its controls unreachable to assistive tech — telling
      // that reader to "zoom in" would name an action they cannot take.
      //
      // "Up to" when the cap was reached: the count is then the cap, not the range's total, and
      // the alert below says so too.
      const count = `${truncated ? 'Up to ' : ''}${points.length.toLocaleString()} interactions`;
      return `${count}${scope}, grouped into clusters. A numbered bubble counts the interactions under it, and zooming in splits them further.`;
    }
    // **No total here, deliberately.** The grid is aggregated on the server and the point
    // list holds at most one probe row, so the client has no count to state — and deriving one
    // from the rollup would be the cross-dimension sum the table below is careful not to
    // invite.
    //
    // It does not assert that cells were drawn either. A cell-free tile is indistinguishable
    // from a range with nothing in it: a 204 carries no body, and an MVT has no field to say
    // which it was. Whether the note scope *withheld* the grid is answered by
    // `interactionScope`, so it reaches the reader as the refusal notice above rather than as
    // a legend on an empty field. The caption describes what the scale *means* and leaves the
    // figures below.
    const scaleNote = hasDensityScale
      ? `The scale is relative to this zoom: the legend's top value is the 95th percentile of non-empty cells, so the full ramp is in use and the densest 5% clamp to red.`
      : scaleLoading
        ? `The per-zoom scale is loading; the colour uses a fixed reference until it arrives.`
        : `The per-zoom scale is unavailable, so the colour uses a fixed reference.`;
    return `Interaction density${scope}, in interactions per km². ${scaleNote}`;
  }, [
    view,
    points.length,
    filteredTo,
    pointsLoading,
    truncated,
    hasDensityScale,
    scaleLoading,
  ]);

  const notice = mapNotice({
    hasMapsKey,
    refused: refused || (view === 'heatmap' && densityRefused),
    failed,
    tileFaulted,
  });

  if (notice === 'refused') {
    // A refusal, not a fault. The note read scope is a different permission from the report
    // scope, so a reader can be entitled to the breakdown and not to the interactions.
    // `withheld` on the one-row probe reports exactly that in both views; a 403 from the tile
    // endpoint lands here too, and means the request itself was refused.
    // Said plainly rather than as "something went wrong", and the figures below carry the same
    // data.
    return (
      <Alert
        className={mergeCss(className)}
        type="info"
        showIcon
        message="Map unavailable"
        description="Your role can read the regional breakdown but not individual interactions, so the map is not shown. The figures below cover the same interactions."
      />
    );
  }

  if (notice === 'failed') {
    // A fault, and it says so. Everything the map would have drawn from the rollup — the
    // boundaries, the table — is still below and unaffected.
    return (
      <Alert
        className={mergeCss(className)}
        type="error"
        showIcon
        message="Map unavailable"
        description={`${GENERIC_ERROR_MESSAGE} We could not load the map. The figures below are unaffected.`}
      />
    );
  }

  if (notice === 'no-key') {
    return (
      <Alert
        className={mergeCss(className)}
        type="info"
        showIcon
        message="Map unavailable"
        description="No Google Maps API key is configured for the admin app. Set VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY. The chart and table below are unaffected."
      />
    );
  }

  return (
    <div className={mergeCss([className])}>
      {/* The map's own positioning context. The legend is a sibling of the map — it has to stay
          in the accessibility tree — so its `bottom-*` has to measure the map, not the caption
          below it. */}
      <div className="relative">
        {/* `role="img"` with a name, not `aria-hidden`: the map is a picture of data that the
            caption and the table state in full, so it is a labelled leaf rather than a container
            whose Google-generated controls are announced one by one. `aria-hidden` cannot be
            used here — Google's map DOM contains real buttons and links, which is the
            `aria-hidden-focus` violation — and `inert` would make the map unusable, taking the
            zoom control a sighted reader uses. `GoogleMap` takes map options and a few container
            props (`id`, `className`, `style`) and forwards no ARIA attributes, so the role has
            to sit on a wrapper.

            `role="img"` is children-presentational, so the zoom control is out of the
            accessibility tree while staying in the tab order — which is why the caption
            describes the view rather than instructing the reader to zoom, and why
            `aria-describedby` carries it: the picture's meaning is the caption and the table,
            not the controls. */}
        <div
          role="img"
          aria-label={
            view === 'heatmap'
              ? 'Map of interaction density'
              : 'Map of interaction locations'
          }
          aria-describedby={captionId}
        >
          <GoogleMap
            id="admin-region-map"
            style={{ width: '100%', height, borderRadius: 6 }}
            defaultCenter={LA_CENTER}
            defaultZoom={LA_ZOOM}
            onCameraChanged={handleCameraChanged}
            gestureHandling="cooperative"
            styles={DATA_FOCUSED_STYLES}
            // The map is a fixed analytical view, not a place to explore. Street View and the
            // map/satellite switch offer ways to look at *imagery* rather than at the data, and
            // the satellite basemap in particular competes with the density field and the
            // boundaries drawn over it. The zoom control stays — it is how you read the clusters.
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            rotateControl={false}
          >
            {/* deck.gl draws the boundaries and whichever view of the interactions is chosen,
                in one overlay. The boundaries are the grouping's geography — all of them,
                including the ones with no interactions.

                Ungrouped there are no boundaries to draw, but the field still is: the density
                grid answers "where were the interactions" without a grouping. The clusters view
                still needs the points, so it waits for them — hence the condition rather than a
                bare mount.

                One element serves both cases, deliberately. Two elements, one per branch, would
                occupy different child slots, so React would unmount the first and mount the
                second on every pick and clear of the grouping; a new deck.gl overlay is a new
                `MVTLayer` with an empty tile cache, so it refetches the density and boundary
                tiles for a grouping-independent URL. `setProps` on one instance is the whole
                point of the deferred teardown in `DeckMapLayers`. */}
            {(dimension !== undefined ||
              view === 'heatmap' ||
              points.length > 0) && (
              <DeckMapLayers
                points={points}
                view={view}
                regionKind={dimension ?? null}
                focusCodes={dimension !== undefined ? focusCodes : EMPTY_FOCUS}
                organizationId={organizationId}
                startDate={startDate}
                endDate={endDate}
                onDensityRefused={markDensityRefused}
                onTileLoaded={handleTilesLoaded}
                onTileFault={markTileFault}
                overlay={mapColors}
                cellAreaKm2={cellAreaKm2}
                densityMax={densityMax}
              />
            )}
          </GoogleMap>
        </div>
        {view === 'heatmap' && (
          <DensityLegend
            cellSideM={cellSideM}
            densityMax={densityMax}
            relative={hasDensityScale}
          />
        )}
      </div>
      <p id={captionId} className="mt-2 text-xs text-neutral-500">
        {caption}
      </p>
      {/* A tile that could not be fetched is reported **beside** the map rather than instead of
          it. Replacing the map would unmount the layers, and then no tile could ever load to
          clear the notice — the fault would outlive the network condition that caused it. Kept
          mounted, the next successful tile clears it (see `handleTilesLoaded`). */}
      {notice === 'tile-fault' && (
        <Alert
          className="mt-2"
          type="warning"
          showIcon
          message="Some map tiles did not load"
          description="The map may be missing areas. It clears itself as soon as a tile loads again; changing the range or grouping also retries."
        />
      )}
      {/* Only the clusters view can be short of interactions now. The density grid is
          aggregated server-side over every interaction in range rather than a capped point
          list, so there is nothing for it to truncate — and `interactionMap`, which reports
          the flag, is not even requested while it is showing. */}
      {view === 'clusters' && truncated && (
        <Alert
          className="mt-2"
          type="warning"
          showIcon
          message="Showing the most recent interactions only"
          description="There are more interactions in this range than the map can plot, so these clusters are a subset. The table and totals below are complete."
        />
      )}
    </div>
  );
}
