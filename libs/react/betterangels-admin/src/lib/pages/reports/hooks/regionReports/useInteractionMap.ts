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
   * Cap on the points the server returns. Omitted leaves the endpoint's own default
   * (`POINT_LIMIT`, 10 000) in force; the server clamps anything above its `POINT_LIMIT_MAX`
   * (50 000). `truncated` reports whether a cap was hit.
   */
  limit?: number;
};

/**
 * Where the interactions were, as individual points.
 *
 * `truncated` says the point cap was reached, which the UI must surface: a partial map
 * that looks complete is worse than no map. The cap is the server's default unless `limit` is
 * passed, and passing `limit` is what the operation's `$limit` variable exists for.
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

  return { points, truncated, loading, error };
}
