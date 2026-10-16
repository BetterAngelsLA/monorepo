/// <reference types="google.maps" />
import { Alert, theme } from 'antd';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Map as GoogleMap } from '@vis.gl/react-google-maps';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { LA_COUNTY_CENTER } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { DeckMapLayers, type OverlayColors } from './DeckMapLayers';
import { DENSITY_COLOR_MAX, HEATMAP_RAMP_CSS } from './heatmapMath';
import type { InteractionPointType } from './hooks';
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
function DensityLegend() {
  return (
    <div
      className="pointer-events-none absolute bottom-9 left-3 rounded bg-white/90 px-2 py-1 shadow"
      style={{ position: 'absolute', zIndex: 5 }}
    >
      {/* 12px is the floor for legible secondary text, and #8c8c8c on white is only 3.36:1
          against a 4.5:1 requirement. These use the 12px/`neutral-700` pairing, which measures
          10.7:1 — the legend is the only key to the colour scale, so leaving it at the least
          readable size on the page was backwards. */}
      <div className="mb-1 text-xs font-medium text-neutral-700">
        Interactions per cell
      </div>
      <div
        className="h-2 w-44 rounded-sm"
        style={{ background: HEATMAP_RAMP_CSS }}
      />
      {/* Numbers, and **absolute** ones. The ramp is normalised by a fixed reference rather
          than by the peak in view, so the honest reading is a count of interactions in a cell,
          not a share of that peak. The middle label sits at the ramp's midpoint because the
          scale is a square root, which puts a quarter of the reference there. */}
      <div className="mt-0.5 flex w-44 justify-between text-xs text-neutral-700">
        <span>0</span>
        <span>{Math.round(DENSITY_COLOR_MAX / 4)}</span>
        <span>{DENSITY_COLOR_MAX}+</span>
      </div>
      <div className="mt-0.5 w-44 text-xs text-neutral-700">
        Each square is one grid cell
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
   * Only the clusters view draws them: the density grid is aggregated server-side, so the
   * point query is not even requested while it is showing — see `LocationBreakdown`.
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
   * The point query was **refused** — the reader's role cannot see individual interactions.
   * Rendered as the permission notice, in place, rather than thrown: the rollup beside it is a
   * separate query that succeeded, so the panel must not be replaced. See `LocationBreakdown`
   * and `isRefusalError`.
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
  className = '',
}: RegionMapProps) {
  const mapColors = useMapColors();

  /**
   * A density tile came back refused, which means the note read scope withheld it.
   *
   * While the grid is showing, the point query that would report the same refusal is not even
   * requested, so the refusal has to be noticed at the tile. Held here, and cleared whenever the
   * question changes, because a refusal for the last date range is not an answer about this one.
   */
  const [densityRefused, setDensityRefused] = useState(false);
  const [tileFaulted, setTileFaulted] = useState(false);
  // The caption below the map is its accessible description; `role="img"` gives what it draws a
  // name, and this points at the sentence that says what the picture means.
  const captionId = useId();
  useEffect(() => {
    setDensityRefused(false);
    // `focusCodes` is state held by the caller, so its identity is the selection.
  }, [organizationId, startDate, endDate, dimension, focusCodes]);

  // Stable identities: these are in the layer memo's dependency list, and a new closure per
  // render would rebuild the whole deck.gl stack — and refetch the tiles — on every render.
  const markDensityRefused = useCallback(() => setDensityRefused(true), []);
  // A tile that loads clears both notices: it is the same evidence the refusal's clear uses,
  // and one transient failure must not replace the map for the rest of the session.
  const handleTilesLoaded = useCallback(() => {
    setDensityRefused(false);
    setTileFaulted(false);
  }, []);
  const markTileFault = useCallback(() => setTileFaulted(true), []);

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
      return `${points.length.toLocaleString()} interactions${scope}, grouped into clusters. A numbered bubble counts the interactions under it, and zooming in splits them further.`;
    }
    // **No total here, deliberately.** The grid is aggregated on the server and the point
    // list is not fetched, so the client has no count to state — and deriving one from the
    // rollup would be the cross-dimension sum the table below is careful not to invite.
    return `Interaction density${scope}, as a grid of counts. Red is where interactions concentrate, blue where they thin out — the legend is an absolute scale, and the table below has the counts per region.`;
  }, [view, points.length, filteredTo, pointsLoading]);

  if (refused || (view === 'heatmap' && densityRefused)) {
    // A refusal, not a fault: the note read scope is a different permission from the report
    // scope, so a reader can be entitled to the breakdown and not to the interactions. Said
    // plainly rather than as "something went wrong", and the table below carries the same
    // data. Reachable two ways — `interactionMap` for the clusters, a refused density tile
    // for the grid — but they are the same refusal.
    return (
      <Alert
        className={mergeCss(className)}
        type="info"
        showIcon
        message="Map unavailable"
        description="Your role can read the regional breakdown but not individual interactions, so the map is not shown. The table below has the same figures per region."
      />
    );
  }

  if (failed || tileFaulted) {
    // A fault, and it says so. Everything the map would have drawn from the rollup — the
    // boundaries, the table — is still below and unaffected.
    //
    // `failed` is the point query; `tileFaulted` is a tile that failed for a reason that is not
    // a refusal. Both leave the map undrawable, and neither may pass silently: an empty field
    // under a legend that promises a density reading is read as "no interactions here".
    return (
      <Alert
        className={mergeCss(className)}
        type="error"
        showIcon
        message="Map unavailable"
        description={`${GENERIC_ERROR_MESSAGE} We could not load the map. The table below has the figures per region.`}
      />
    );
  }

  if (!hasMapsKey) {
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
    <div className={mergeCss(['relative', className])}>
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
          aria-label="Map of interaction locations"
          aria-describedby={captionId}
        >
          <GoogleMap
            id="admin-region-map"
            style={{ width: '100%', height: 560, borderRadius: 6 }}
            defaultCenter={LA_CENTER}
            defaultZoom={LA_ZOOM}
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
            {(dimension !== undefined || view === 'heatmap' || points.length > 0) && (
              <DeckMapLayers
                points={points}
                view={view}
                regionKind={dimension ?? null}
                focusCodes={dimension !== undefined ? focusCodes : EMPTY_FOCUS}
                organizationId={organizationId}
                startDate={startDate}
                endDate={endDate}
                onDensityRefused={markDensityRefused}
                onDensityLoaded={handleTilesLoaded}
                onTileFault={markTileFault}
                overlay={mapColors}
              />
            )}
          </GoogleMap>
        </div>
        {view === 'heatmap' && <DensityLegend />}
      </div>
      <p id={captionId} className="mt-2 text-xs text-neutral-500">
        {caption}
      </p>
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
          description="There are more interactions in this range than the map can plot, so these clusters are a subset — the counts and table below are complete."
        />
      )}
    </div>
  );
}
