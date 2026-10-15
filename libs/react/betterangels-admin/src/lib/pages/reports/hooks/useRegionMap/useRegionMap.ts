import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { useMemo } from 'react';
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

  const regions = useMemo(
    () => (data?.regions ?? []).filter((region) => (region.geometry ?? '').length > 0),
    [data],
  );

  return { regions, loading, error };
}
