import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { useMemo } from 'react';
import type { Feature } from 'geojson';
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
   * Ready-to-draw GeoJSON Features, parsed **once** here rather than per render.
   *
   * The API sends `geometry` as a GeoJSON string (a payload decision — the simplified
   * polygons are 817 kB against 21 MB unsimplified; see the backend's `regions/schema.py`).
   * Parsing is cheap individually and wasteful collectively, so it happens once per query
   * result and the renderer gets objects.
   *
   * `count` is not set here — the caller joins it from the rollup, because the two queries
   * are deliberately separate: the boundaries are the grouping's geography, and drawing only
   * the regions that happen to have interactions would silently drop the empty ones.
   */
  const regions = useMemo<Feature[]>(() => {
    const features: Feature[] = [];
    for (const region of data?.regions ?? []) {
      const geometry = (region.geometry ?? '').trim();
      if (!geometry) {
        continue;
      }
      try {
        features.push({
          type: 'Feature',
          properties: { code: region.code, name: region.name, count: 0 },
          geometry: JSON.parse(geometry) as Feature['geometry'],
        });
      } catch {
        // One malformed polygon must not blank the whole overlay.
        console.warn(
          `[useRegionMap] could not parse geometry for ${region.code}`,
        );
      }
    }
    return features;
  }, [data]);

  return { regions, loading, error };
}
