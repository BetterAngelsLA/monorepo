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
   * Required by the query, and rightly so: without a dimension there is nothing to draw.
   * "All" means every dimension at once, and overlaying six sets of boundaries — 431
   * polygons, many nested inside each other — would be unreadable rather than
   * informative. So the request is skipped and the map shows the heatmap alone.
   */
  dimension?: RegionDimension;
  /** Only the codes that actually have interactions are requested. */
  codes: string[];
};

/**
 * Fetches the boundaries needed to draw the choropleth.
 *
 * `interactionsByRegion` reports only regions that actually have interactions, so
 * driving the geometry request from those codes avoids shipping polygons nobody
 * will look at — a real saving on the 311-region ZIP dimension.
 */
export function useRegionMap({ dimension, codes }: UseRegionMapArgs) {
  const { data, loading, error } = useQuery<
    RegionsForMapQuery,
    RegionsForMapQueryVariables
  >(RegionsForMapDocument, {
    variables: { dimension: dimension as RegionDimension, codes },
    skip: dimension === undefined || codes.length === 0,
  });

  const regions = useMemo(
    () => (data?.regions ?? []).filter((region) => region.geometry.length > 0),
    [data],
  );

  return { regions, loading, error };
}
