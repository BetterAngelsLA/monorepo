import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { useMemo } from 'react';
import {
  InteractionMapDocument,
  type InteractionMapQuery,
  type InteractionMapQueryVariables,
} from './__generated__/regions.generated';

/** One interaction location, as returned by `interactionMap`. */
export type InteractionPointType =
  InteractionMapQuery['interactionMap']['points'][number];
type UseInteractionMapArgs = {
  organizationId: string;
  startDate: string;
  endDate: string;
  /** Absent means every dimension at once; `regionCodes` is then not meaningful. */
  dimension?: RegionDimension;
  /**
   * False while the map is off screen, which holds the request back.
   *
   * The panel sits below the fold and its payload is the largest on the page, so fetching it
   * on mount spends a megabyte on a panel the reader may never scroll to.
   */
  enabled?: boolean;
  /** Narrow the map to these regions of `dimension` — "show me the SPA 4 visits". */
  regionCodes?: string[];
  /**
   * Cap the points returned, overriding the server's own. Only the density view passes it: one
   * row is enough to read `withheld`, and the grid plots none of them.
   */
  limit?: number;
};

/**
 * Where the interactions were, as individual points.
 *
 * `truncated` says the point cap was reached, which the UI must surface: a partial map
 * that looks complete is worse than no map. `limit` overrides the cap; left `undefined`, the
 * server's default (`POINT_LIMIT`, 10 000) applies and the answer is the endpoint's standard
 * read.
 *
 * Coordinates only. There is deliberately no client or note field on this query,
 * and it is authorized by the note read scope rather than the report scope alone.
 *
 * The previous points are held across a variables change for the same reason the rollup holds
 * its rows: narrowing the map to another region is a cache miss, so without this the layer
 * empties and the map flashes blank between two answers that are both about the same data.
 */
export function useInteractionMap({
  organizationId,
  startDate,
  endDate,
  dimension,
  regionCodes,
  limit,
  enabled = true,
}: UseInteractionMapArgs) {
  const { data, previousData, loading, error } = useQuery<
    InteractionMapQuery,
    InteractionMapQueryVariables
  >(InteractionMapDocument, {
    variables: {
      organizationId,
      startDate,
      endDate,
      dimension,
      regionCodes,
      limit,
    },
    skip: !organizationId || !enabled,
  });

  const activeData = data ?? previousData;

  const points = useMemo(
    () => activeData?.interactionMap?.points ?? [],
    [activeData],
  );
  const truncated = activeData?.interactionMap?.truncated ?? false;
  // The note scope removed every pin while the period had some. Held across a variables change
  // like the points are, so a refetch cannot flash "no interactions" over a permission answer.
  const withheld = activeData?.interactionMap?.withheld ?? false;

  return { points, truncated, withheld, loading, error };
}
