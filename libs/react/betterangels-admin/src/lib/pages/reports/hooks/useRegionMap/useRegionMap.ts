import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { useMemo } from 'react';
import type { Feature, Position } from 'geojson';
import {
  RegionsForMapDocument,
  type RegionsForMapQuery,
  type RegionsForMapQueryVariables,
} from './__generated__/regions.generated';

/** A region polygon as returned by the `regions` query. */
export type RegionGeometryType = RegionsForMapQuery['regions'][number];

type UseRegionMapArgs = {
  /**
   * Required, because the query requires it: without a dimension there is nothing to draw.
   * "All" would mean overlaying six sets of boundaries — 431 polygons, many nested inside each
   * other — which is unreadable rather than informative. The caller fetches only when it has a
   * dimension, so this is not optional and no call site needs to assert it.
   */
  dimension: RegionDimension;
  /**
   * Which regions of `dimension` to draw. Empty means **all of them**, matching the way
   * an empty list is read everywhere else in this feature: no restriction, rather than no
   * matches. Requesting `[]` literally would return nothing and draw a blank overlay.
   */
  codes: string[];
};

/**
 * Fetches the boundaries of the grouping, for the map overlay.
 *
 * This is **not** driven by which regions have interactions. It was, and that was wrong:
 * choosing City Council District drew only the districts that happened to have data, so
 * the three with none vanished and the map stopped answering "where are the districts?".
 * The overlay is the grouping's geography; `codes` narrows it only when the reader has
 * drilled into specific regions.
 */
/**
 * Whether a value has the shape of GeoJSON MultiPolygon coordinates.
 *
 * Four levels, not three: a MultiPolygon is `[polygon][ring][position][lng, lat]`. Getting
 * this wrong is not cosmetic — a `Polygon` geometry built from `[[[lng, lat]]]` type-checks
 * against nothing and silently renders as a point cloud.
 *
 * It checks the nesting and that the innermost pair is numeric, which is what a renderer
 * needs. It deliberately does not validate ring closure or winding order — deck.gl handles
 * those, and re-implementing geometry validation is how a guard like this turns into a bug
 * farm.
 */
export function isMultiPolygonCoordinates(
  value: unknown,
): value is Position[][][][] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  const [polygon] = value;
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return false;
  }
  const [ring] = polygon;
  if (!Array.isArray(ring) || ring.length === 0) {
    return false;
  }
  const [point] = ring;
  return (
    Array.isArray(point) &&
    point.length === 2 &&
    typeof point[0] === 'number' &&
    typeof point[1] === 'number'
  );
}

export function useRegionMap({ dimension, codes }: UseRegionMapArgs) {
  const { data, loading, error } = useQuery<
    RegionsForMapQuery,
    RegionsForMapQueryVariables
  >(RegionsForMapDocument, {
    variables: {
      dimension,
      // An empty list means "all of this dimension", matching how an absent code list is
      // read everywhere else here. Sending `[]` literally would match nothing.
      codes: codes.length > 0 ? codes : undefined,
    },
  });

  /**
   * Ready-to-draw GeoJSON Features, assembled **once** here rather than per render.
   *
   * The API sends `geometry` as the `coordinates` of a MultiPolygon — `[[[lng, lat], …]]`,
   * carried by the `JSON` scalar — not as a GeoJSON document, so there is nothing to parse.
   * (The polygons *are* simplified server-side, which matters: 817 kB against 21 MB
   * unsimplified. See the backend's `regions/selectors.py`.)
   *
   * `count` is not set here — the caller joins it from the rollup, because the two queries
   * are deliberately separate: the boundaries are the grouping's geography, and drawing only
   * the regions that happen to have interactions would silently drop the empty ones.
   */
  const regions = useMemo<Feature[]>(() => {
    const features: Feature[] = [];
    for (const region of data?.regions ?? []) {
      // Narrowed rather than trusted: the scalar is untyped (`JSON` maps to `any` in the
      // shared codegen config), so a shape check here is what keeps a backend change from
      // becoming a silent blank map. A row with no coordinates is skipped rather than
      // drawn as an empty polygon.
      const coordinates = region.geometry as unknown;
      if (!isMultiPolygonCoordinates(coordinates)) {
        console.warn(
          `[useRegionMap] ignoring geometry for ${region.code}: expected MultiPolygon coordinates`,
        );
        continue;
      }
      features.push({
        type: 'Feature',
        properties: { code: region.code, name: region.name, count: 0 },
        // `as unknown as` because `@types/geojson` declares MultiPolygon.coordinates as
        // `Position[][][]` — three levels — where RFC 7946 requires four
        // (`[polygon][ring][position][lng, lat]`), which is what the backend sends and what
        // deck.gl reads. The cast is the type-definition gap, not a shape we are unsure of;
        // the guard above is what actually validates it at runtime.
        geometry: {
          type: 'MultiPolygon',
          coordinates,
        } as unknown as Feature['geometry'],
      });
    }
    return features;
  }, [data]);

  return { regions, loading, error };
}
