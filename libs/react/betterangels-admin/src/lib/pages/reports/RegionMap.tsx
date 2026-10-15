/// <reference types="google.maps" />
import { Map as GoogleMap } from '@vis.gl/react-google-maps';
import {
  HEATMAP_RAMP_CSS,
  type HeatPoint,
} from './heatmapMath';
import { DeckMapLayers } from './DeckMapLayers';
import { Alert, theme } from 'antd';
import { useMemo } from 'react';
import type { RegionDimension } from '@monorepo/ba-platform/types';

import { LA_COUNTY_CENTER } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import type { InteractionPointType, RegionCountType } from './hooks';
/** Stable identity, so the ungrouped map does not rebuild its layers on every render. */
const EMPTY_COUNTS = new Map<string, number>();
/** Same reason as `EMPTY_COUNTS`: a stable identity for the ungrouped case. */
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
 * Under a heatmap every business pin, restaurant label and attraction icon is noise
 * competing with the field being read, and it is worst exactly where the data is densest —
 * central LA — where the clutter and the heat overlap.
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
  // Softened so the basemap sits behind the heatmap instead of beside it.
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
 * Choropleth colours from the design system.
 *
 * Read through `useToken` rather than importing hexes, so a theme change flows through — the
 * values these replaced were Material palette entries that ignored the theme entirely.
 */
function useMapColors() {
  const { token } = theme.useToken();
  const { colorFillSecondary, colorText, colorError } = token;
  // Memoised on the token values, not returned as a fresh literal: the result is in the layer
  // memo's dependency list, so a new object identity on every render rebuilt the whole deck.gl
  // layer stack — including re-binning the clusters over every point — for a render that
  // changed nothing the map can see.
  return useMemo(
    () =>
      ({
        // antd's neutral palette is defined to meet contrast on light and dark backgrounds, so
        // the overlay stays legible over raster tiles.
        emptyFill: colorFillSecondary,
        fullFill: colorText,
        stroke: colorText,
        // The cluster marks use the error red: the palette's warm accent, and the one hue that
        // reads against the basemap's greens and blues.
        markFill: colorError,
      }) as const,
    [colorFillSecondary, colorText, colorError],
  );
}

/**
 * Resolves the grouping's boundaries and hands everything to deck.gl.
 *
 * Split out so the query can require a dimension — the API refuses a code without one,
 * because a code is ambiguous across dimensions — without every call site asserting it. This
 * only mounts when a grouping is chosen, so the requirement is carried by the component tree.
 *
 * The two queries are joined here, on `code`: the rollup says how many interactions each
 * region has, and the geometry says where the regions are. Driving the geometry from the
 * rollup would draw only the regions that happen to have data and silently lose the rest.
 */
function RegionOverlay({
  dimension,
  rows,
  focusCodes,
  overlay,
  points,
  view,
}: {
  dimension: RegionDimension;
  rows: RegionCountType[];
  focusCodes: string[];
  overlay: {
    emptyFill: string;
    fullFill: string;
    stroke: string;
    markFill: string;
  };
  points: HeatPoint[];
  view: MapView;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (!row.isUnassigned) {
        map.set(row.code, row.count);
      }
    }
    return map;
  }, [rows]);

  const maxCount = useMemo(
    () =>
      rows.reduce(
        (max, row) => (row.isUnassigned ? max : Math.max(max, row.count)),
        0,
      ),
    [rows],
  );

  return (
    <>
      <DeckMapLayers
        points={points}
        view={view}
        regionKind={dimension}
        counts={counts}
        focusCodes={focusCodes}
        maxCount={maxCount}
        overlay={overlay}
      />
    </>
  );
}

/** The map's views. Heatmap is the default; see `RegionMap` below. */
export type MapView = 'heatmap' | 'clusters';

type RegionMapProps = {
  /** Absent when the report is not grouped by geography; then no polygons are drawn. */
  dimension?: RegionDimension;
  rows: RegionCountType[];
  /** Individual interaction locations, from `interactionMap`. */
  points?: InteractionPointType[];
  /** True when the point cap was reached and the clusters are a subset. */
  truncated?: boolean;
  /** Names of the regions the map is narrowed to, if any. */
  filteredTo?: string;
  /** Region codes the reader narrowed to; the viewport frames these. */
  focusCodes?: string[];
  /** The app owns the key; the lib only needs to know whether one exists. */
  hasMapsKey?: boolean;
  /**
   * The point query was refused or failed. Rendered as an in-place notice rather than
   * thrown, because the rollup beside it is a separate query that may well have succeeded —
   * see `LocationBreakdown`. The boundaries and the table stay useful without pins.
   */
  failed?: boolean;
  /**
   * Which rendering of the same data to draw. Owned by the caller so its toggle can sit in
   * the card header rather than inside the map, and defaulted so a caller offering no
   * choice does not have to pass one.
   */
  view?: MapView;
  className?: string;
};

/**
 * Interactions by region, drawn on a map.
 *
 * Geometry and counts are fetched separately and joined on `code` on the client.
 * `interactionsByRegion` reports only regions that actually have interactions, so
 * driving the geometry request from those codes avoids shipping polygons nobody
 * will look at — a real saving on the 311-region ZIP dimension.
 */
export function RegionMap({
  dimension,
  rows,
  points = [],
  truncated = false,
  filteredTo,
  focusCodes = [],
  hasMapsKey = true,
  failed = false,
  view = 'heatmap',
  className = '',
}: RegionMapProps) {
  // Heatmap first: density over an area is the question this page is usually asked, and
  // the choropleth is the same data once you know where to look.
  //
  const mapColors = useMapColors();

  const caption = useMemo(() => {
    const scope = filteredTo ? ` within ${filteredTo}` : '';
    if (view === 'clusters') {
      // Not "each dot is one interaction" any more: points in the same screen cell are
      // merged into one bubble, so a dot stands for one *or more*.
      return `${points.length.toLocaleString()} interactions${scope}, grouped into clusters. A numbered bubble counts the interactions under it; zoom in to split it.`;
    }
    if (view === 'heatmap') {
      return `Density of interactions${scope}, as a continuous field. Red is where interactions concentrate, blue where they thin out — relative only, so read the table below for counts.`;
    }
    return `Interactions in this range${scope}.`;
  }, [view, points.length, filteredTo]);
  if (failed) {
    // A refusal, not a fault: the note read scope is a different permission from the report
    // scope, so a reader can be entitled to the breakdown and not to the pins. Said plainly
    // rather than as "something went wrong", and the table below carries the same data.
    return (
      <Alert
        className={mergeCss(className)}
        type="info"
        showIcon
        message="Map unavailable"
        description="Your role can read the regional breakdown but not individual interactions, so the pins are not shown. The table below has the same figures per region."
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
      {/* The map is a picture of data that the table states in full, so it is marked
          decorative rather than read out as an empty container — the same treatment a purely
          ornamental image gets. `GoogleMap` does not forward aria attributes, so the marker
          has to sit on a wrapper. */}
      <div aria-hidden="true">
        <GoogleMap
          id="admin-region-map"
          style={{ width: '100%', height: 560, borderRadius: 6 }}
          defaultCenter={LA_CENTER}
          defaultZoom={LA_ZOOM}
          gestureHandling="cooperative"
          styles={DATA_FOCUSED_STYLES}
          // The map is a fixed analytical view, not a place to explore. Street View and the
          // map/satellite switch offer ways to look at *imagery* rather than at the data, and
          // the satellite basemap in particular competes with the heatmap and the boundaries
          // drawn over it. The zoom control stays — it is how you read the clusters.
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          rotateControl={false}
        >
          {/* deck.gl draws both the boundaries and the points, in one overlay. The
              boundaries are the grouping's geography — all of them, including the ones
              with no interactions — and the points layer draws only for the chosen view. */}
          {dimension !== undefined && (
            <RegionOverlay
              dimension={dimension}
              rows={rows}
              focusCodes={focusCodes}
              overlay={mapColors}
              points={points}
              view={view}
            />
          )}
          {dimension === undefined && points.length > 0 && (
            // Ungrouped there are no boundaries to draw, but the field still is: the
            // heatmap answers "where were the interactions" without a grouping.
            <DeckMapLayers
              points={points}
              view={view}
              regionKind={null}
              counts={EMPTY_COUNTS}
              focusCodes={EMPTY_FOCUS}
              maxCount={0}
              overlay={mapColors}
            />
          )}
          {/* On the map rather than beside it: the ramp is meaningless without knowing it is
            absolute, and a reader looking at a gradient should not have to hunt for its
            key. Positioned bottom-left, clear of the map's own controls. */}
          {view === 'heatmap' && (
            <div
              // Lifted clear of Google's own attribution, which owns the bottom-left corner
              // and must stay readable — it is a licence term, not decoration.
              className="pointer-events-none absolute bottom-9 left-3 rounded bg-white/90 px-2 py-1 shadow"
              // Placed inside the map container via the GoogleMap child slot; the map's own
              // DOM is a sibling, so absolute positioning is relative to this wrapper.
              style={{ position: 'absolute', zIndex: 5 }}
            >
              {/* 12px is the floor for legible secondary text, and #8c8c8c on white is only
                3.36:1 against a 4.5:1 requirement. These use the 12px/`neutral-700` pairing,
                which measures 10.7:1 — the legend is the only key to the colour scale, so
                leaving it at the least readable size on the page was backwards. */}
              <div className="mb-1 text-xs font-medium text-neutral-700">
                Interaction density
              </div>
              <div
                className="h-2 w-44 rounded-sm"
                style={{ background: HEATMAP_RAMP_CSS }}
              />
              {/* Numbers rather than "fewer"/"more". The ramp is normalised against the
                busiest area in the whole selection, so the honest reading is a share of
                that peak — not an absolute count, which the weighted sum is not. */}
              <div className="mt-0.5 flex w-44 justify-between text-xs text-neutral-700">
                <span>0</span>
                <span>50</span>
                <span>100%</span>
              </div>
              <div className="mt-0.5 w-44 text-xs text-neutral-700">
                100% = the densest area in this selection
              </div>
            </div>
          )}
        </GoogleMap>
      </div>
      <p className="mt-2 text-xs text-neutral-500">{caption}</p>
      {/* Both views plot the same capped point set, so both have to say when it is a subset.
          The heatmap is the default view, so gating this on `clusters` meant the warning was
          hidden in exactly the case most readers saw. */}
      {truncated && (
        <Alert
          className="mt-2"
          type="warning"
          showIcon
          message="Showing the most recent interactions only"
          description={
            view === 'clusters'
              ? 'There are more interactions in this range than the map can plot, so these clusters are a subset — the counts and table below are complete.'
              : 'There are more interactions in this range than the map can plot, so this field is drawn from a subset — the counts and table below are complete.'
          }
        />
      )}
    </div>
  );
}
