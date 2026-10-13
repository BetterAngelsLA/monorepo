/// <reference types="google.maps" />
import { Map as GoogleMap, useMap } from '@vis.gl/react-google-maps';
import { Alert, Spin } from 'antd';
import { useEffect, useMemo } from 'react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { mergeCss } from '@monorepo/react/shared';
import {
  useRegionMap,
  type RegionCountType,
  type RegionGeometryType,
} from './hooks';

const LA_CENTER = { lat: 34.05, lng: -118.35 };
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
}: {
  rows: RegionCountType[];
  regions: RegionGeometryType[];
}) {
  const map = useMap();

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
      const count = featureNumber(feature, 'count');
      return {
        fillColor: shade(max, count),
        fillOpacity: count > 0 ? 0.75 : 0.15,
        strokeColor: '#1B3A5C',
        strokeWeight: 0.8,
        strokeOpacity: 0.6,
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

    const bounds = new google.maps.LatLngBounds();
    layer.forEach((f: google.maps.Data.Feature) => {
      const featureBounds = new google.maps.LatLngBounds();
      f.getGeometry()?.forEachLatLng((ll: google.maps.LatLng) =>
        featureBounds.extend(ll),
      );
      if (!featureBounds.isEmpty()) bounds.union(featureBounds);
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, 32);

    return () => {
      google.maps.event.removeListener(overListener);
      google.maps.event.removeListener(outListener);
      layer.forEach((f: google.maps.Data.Feature) => layer.remove(f));
      map.getDiv().removeAttribute('title');
    };
  }, [map, regions, countsByCode, max]);

  return null;
}

type RegionMapProps = {
  dimension: RegionDimension;
  rows: RegionCountType[];
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
  hasMapsKey = true,
  className = '',
}: RegionMapProps) {
  const codes = useMemo(
    () => rows.filter((r) => !r.isUnassigned && r.count > 0).map((r) => r.code),
    [rows],
  );

  const { regions, loading, error } = useRegionMap({ dimension, codes });

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
      <GoogleMap
        id="admin-region-map"
        style={{ width: '100%', height: 420, borderRadius: 6 }}
        defaultCenter={LA_CENTER}
        defaultZoom={LA_ZOOM}
        gestureHandling="cooperative"
      >
        <RegionLayer rows={rows} regions={regions} />
      </GoogleMap>
      <p className="mt-2 text-xs text-neutral-500">
        Regions shaded by interaction count. Areas with no shading had no
        interactions in this range.
      </p>
    </div>
  );
}
