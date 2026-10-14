/// <reference types="google.maps" />
import { Map as GoogleMap, useMap } from '@vis.gl/react-google-maps';
import { HEATMAP_RAMP_CSS, HeatmapLayer } from './HeatmapLayer';
import { PointLayer } from './PointLayer';
import { Alert, Radio, Spin } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { mergeCss } from '@monorepo/react/shared';
import {
  useRegionMap,
    type InteractionPointType,
  type RegionCountType,
  type RegionGeometryType,
} from './hooks';

const LA_CENTER = { lat: 34.05, lng: -118.35 };

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
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
  // The green "Mt San Antonio" badge survives the `poi` rule because it is a *terrain*
  // label, not a point of interest — it lives under `landscape.natural`. Terrain names are
  // orientation at the scale of a whole county, which this map is never read at.
  { featureType: 'landscape.natural', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  // Icons and shields multiply the noise on their own, even where labels are useful.
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  // Softened so the basemap sits behind the heatmap instead of beside it.
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ saturation: -40 }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -60 }, { lightness: 15 }] },
];
const LA_ZOOM = 9;

/**
 * `google.maps.Data.Feature` properties are typed `unknown`, so the two readers
 * narrow them instead of casting at every call site.
 */
function featureNumber(feature: google.maps.Data.Feature, name: string): number {
  const value = feature.getProperty(name);
  return typeof value === 'number' ? value : 0;
}

function featureString(feature: google.maps.Data.Feature, name: string): string {
  const value = feature.getProperty(name);
  return typeof value === 'string' ? value : '';
}

/**
 * Choropleth ramp: low counts pale, high counts saturated. Deliberately a single
 * hue — this is one series (interaction count), and a multi-hue scale would imply
 * categories that do not exist. sqrt keeps the mid-range visible instead of letting
 * one dominant district flatten everything else to near-white.
 */
function shade(max: number, count: number): string {
  if (max <= 0) return '#DCE3EA';
  const t = Math.sqrt(Math.max(0, count) / max);
  const r = Math.round(0xdc + (0x1b - 0xdc) * t);
  const g = Math.round(0xe3 + (0x3a - 0xe3) * t);
  const b = Math.round(0xea + (0x5c - 0xea) * t);
  return `rgb(${r},${g},${b})`;
}

/** The map's views. Heatmap is the default; see `RegionMap` below. */
export type MapView = 'heatmap' | 'pins';

/**
 * Draws the choropleth. Must be a child of `<GoogleMap>`, which is what provides
 * the map context that `useMap()` reads.
 *
 * Uses the map's built-in Data layer (`map.data`) rather than one `<Polygon>` per
 * region, for two reasons:
 *
 * 1. The API returns GeoJSON, and `addGeoJson` consumes it directly.
 * 2. `google.maps.Data` handles **MultiPolygon** correctly. Regions with islands or
 *    enclaves (Long Beach, Santa Catalina, the unincorporated pockets) are
 *    multipolygons, and a naive one-polygon-per-feature render silently drops every
 *    ring but the first.
 *
 * `map.data` also sidesteps `useMapsLibrary`: Data is part of the core Maps API, not
 * a separately-loaded library, so there is no load-order race to wait on.
 */
function RegionLayer({
  rows,
  regions,
  focusCodes,
}: {
  rows: RegionCountType[];
  regions: RegionGeometryType[];
  /**
   * Region codes to restrict to. Empty means every region of the dimension, so the
   * grouping's full geography is shown; a drill-down narrows it to those regions.
   */
  focusCodes: string[];
}) {
  const map = useMap();
  // One automatic fit per mount; after that the viewport belongs to the reader.
  const hasFittedRef = useRef(false);

  const countsByCode = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.isUnassigned) m.set(r.code, r.count);
    });
    return m;
  }, [rows]);

  const max = useMemo(
    () =>
      rows.reduce((acc, r) => {
        if (r.isUnassigned) return acc;
        return Math.max(acc, r.count);
      }, 0),
    [rows],
  );

  useEffect(() => {
    if (!map || regions.length === 0) return;

    // `map.data` is one shared layer per map. Clear it first so switching dimension
    // does not stack the previous dimension's polygons underneath the new ones.
    const layer = map.data;
    layer.forEach((f: google.maps.Data.Feature) => layer.remove(f));

    regions.forEach((region) => {
      try {
        layer.addGeoJson({
          type: 'Feature',
          properties: {
            code: region.code,
            name: region.name,
            count: countsByCode.get(region.code) ?? 0,
          },
          geometry: JSON.parse(region.geometry),
        });
      } catch {
        // One malformed polygon must not blank the whole map.
        console.warn(`[RegionMap] could not parse geometry for ${region.code}`);
      }
    });

    layer.setStyle((feature: google.maps.Data.Feature) => {
      // Only region polygons live on the Data layer now; points are drawn on a canvas.
      const count = featureNumber(feature, 'count');
      // These are the grouping's boundaries, so they have to be readable *through* the
      // heatmap — an earlier pass used 0.04-0.12 fill and 0.55 stroke, which was
      // effectively invisible under a dense field and read as "the districts aren't
      // drawn at all". The fill stays a light tint; the outline carries the shape.
      return {
        fillColor: shade(max, count),
        fillOpacity: count > 0 ? 0.18 : 0.06,
        strokeColor: '#0F2438',
        strokeWeight: 1.4,
        strokeOpacity: 0.85,
      };
    });

    const onOver = (event: google.maps.Data.MouseEvent) => {
      const name = featureString(event.feature, 'name');
      const count = featureNumber(event.feature, 'count');
      layer.overrideStyle(event.feature, { strokeWeight: 2, fillOpacity: 0.9 });
      // A native tooltip: it follows the cursor and needs no info-window wiring.
      map.getDiv().setAttribute('title', `${name}: ${count.toLocaleString()}`);
    };
    const onOut = (event: google.maps.Data.MouseEvent) => {
      layer.revertStyle(event.feature);
      map.getDiv().removeAttribute('title');
    };

    const overListener = layer.addListener('mouseover', onOver);
    const outListener = layer.addListener('mouseout', onOut);

    /**
     * Frame a set of features, or everything when `codes` is empty.
     *
     * Fitting on a *selection* is right every time it changes — narrowing to two
     * districts means the reader wants to look at those two. Fitting on the *whole*
     * dimension is only right once: repeating it on every dimension change would reset
     * the zoom the reader chose, and for a county-wide dimension such as SPA it zooms
     * out far enough to make the map unreadable.
     */
    const frame = (codes: string[]) => {
      const bounds = new google.maps.LatLngBounds();
      layer.forEach((f: google.maps.Data.Feature) => {
        if (codes.length > 0 && !codes.includes(featureString(f, 'code'))) {
          return;
        }
        const featureBounds = new google.maps.LatLngBounds();
        f.getGeometry()?.forEachLatLng((ll: google.maps.LatLng) =>
          featureBounds.extend(ll),
        );
        if (!featureBounds.isEmpty()) bounds.union(featureBounds);
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 48);
      }
    };

    if (focusCodes.length > 0) {
      frame(focusCodes);
    } else if (!hasFittedRef.current) {
      frame([]);
      hasFittedRef.current = true;
    }

    return () => {
      google.maps.event.removeListener(overListener);
      google.maps.event.removeListener(outListener);
      layer.forEach((f: google.maps.Data.Feature) => layer.remove(f));
      map.getDiv().removeAttribute('title');
    };
  }, [map, regions, countsByCode, max, focusCodes]);

  return null;
}

type RegionMapProps = {
  /** Absent when the report is not grouped by geography; then no polygons are drawn. */
  dimension?: RegionDimension;
  rows: RegionCountType[];
  /** Individual interaction locations, from `interactionMap`. */
  points?: InteractionPointType[];
  /** True when the point cap was reached and the pins are a subset. */
  truncated?: boolean;
  /** Names of the regions the map is narrowed to, if any. */
  filteredTo?: string;
  /** Region codes the reader narrowed to; the viewport frames these. */
  focusCodes?: string[];
  /** The app owns the key; the lib only needs to know whether one exists. */
  hasMapsKey?: boolean;
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
  className = '',
}: RegionMapProps) {
  // Heatmap first: density over an area is the question this page is usually
  // asked, and the choropleth is the same data once you know where to look.
  const [view, setView] = useState<MapView>('heatmap');

  const caption = useMemo(() => {
    const scope = filteredTo ? ` within ${filteredTo}` : '';
    if (view === 'pins') {
      // Not "each dot is one interaction" any more: points in the same screen cell are
      // merged into one bubble, so a dot stands for one *or more*.
      return `${points.length.toLocaleString()} interactions${scope}, clustered by area. A numbered bubble counts the interactions under it; zoom in to split it.`;
    }
    if (view === 'heatmap') {
      return `Density of interactions${scope}, as a continuous field. Red is where interactions concentrate, blue where they thin out — relative only, so read the table below for counts.`;
    }
    return `Interactions in this range${scope}.`;
  }, [view, points.length, filteredTo]);
  // The overlay is the *grouping's* geography, not the data's: choosing City Council
  // District should show all fifteen districts, including the ones with no interactions
  // in range. Driving this from the rollup's codes was wrong — it drew only the twelve
  // that had data, so three districts silently vanished and the map no longer answered
  // "where are the districts?".
  //
  // An empty list therefore means "all of this dimension", and only a drill-down narrows
  // it. With no dimension at all the hook skips the request and nothing is drawn, which is
  // the intended resting state.
  const { regions, loading, error } = useRegionMap({ dimension, codes: focusCodes });

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  if (!hasMapsKey) {
    return (
      <Alert
        className={mergeCss(className)}
        type="info"
        showIcon
        message="Map unavailable"
        description="No Google Maps API key is configured for the admin app. Set VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY (it currently falls back to VITE_SHELTER_GOOGLE_MAPS_API_KEY). The chart and table below are unaffected."
      />
    );
  }

  if (error) {
    return (
      <Alert
        className={mergeCss(className)}
        type="error"
        showIcon
        message="Sorry, something went wrong."
        description="We could not load the region boundaries. The chart and table below are unaffected."
      />
    );
  }

  return (
    <div className={mergeCss(['relative', className])}>
      {loading && (
        <div className="absolute top-2 right-2 z-10 rounded bg-white/90 px-2 py-1 text-xs text-neutral-600">
          <Spin size="small" /> loading boundaries...
        </div>
      )}
      <div className="mb-2">
        <Radio.Group
          value={view}
          onChange={(event) => setView(event.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: 'Heatmap', value: 'heatmap' },
            { label: 'Interactions', value: 'pins' },
          ]}
        />
      </div>
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
        <RegionLayer
          rows={rows}
          regions={regions}
          focusCodes={focusCodes}
        />
        {/* Both layers are always mounted. The overlay draws whichever regions the
            grouping resolved to — none, when nothing did — rather than being a view of
            its own, and the point layer draws only for the pins view. */}
        {view === 'heatmap' && <HeatmapLayer points={points} />}
        {view === 'pins' && <PointLayer points={points} />}
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
            <div className="mb-1 text-[10px] font-medium text-neutral-600">
              Interaction density
            </div>
            <div className="h-2 w-40 rounded-sm" style={{ background: HEATMAP_RAMP_CSS }} />
            {/* Numbers rather than "fewer"/"more". The ramp is normalised against the
                busiest area in the whole selection, so the honest reading is a share of
                that peak — not an absolute count, which the weighted sum is not. */}
            <div className="mt-0.5 flex w-40 justify-between text-[10px] text-neutral-600">
              <span>0</span>
              <span>50</span>
              <span>100%</span>
            </div>
            <div className="mt-0.5 w-40 text-[10px] text-neutral-500">
              100% = the densest spot in this selection
            </div>
            {/* "everywhere" would be a lie about zoom: the kernel radius changes with
                zoom, so the reference is per-zoom. It is fixed against *panning*, which
                is the thing that was wrong. */}
            <div className="text-[10px] text-neutral-500">fixed when you pan</div>
          </div>
        )}
      </GoogleMap>
      <p className="mt-2 text-xs text-neutral-500">{caption}</p>
      {truncated && view === 'pins' && (
        <Alert
          className="mt-2"
          type="warning"
          showIcon
          message="Showing the most recent interactions only"
          description="There are more interactions in this range than the map can plot, so the pins are a subset — the counts and table below are complete."
        />
      )}
    </div>
  );
}
