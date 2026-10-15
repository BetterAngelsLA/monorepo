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
};

/**
 * Where the interactions were, as individual points.
 *
 * `truncated` says the point cap was reached, which the UI must surface: a partial map
 * that looks complete is worse than no map.
 *
 * Coordinates only. There is deliberately no client or note field on this query,
 * and it is authorized by the note read scope rather than the report scope alone.
 */
export function useInteractionMap({
  organizationId,
  startDate,
  endDate,
  dimension,
  regionCodes,
  enabled = true,
}: UseInteractionMapArgs) {
  const { data, loading, error } = useQuery<
    InteractionMapQuery,
    InteractionMapQueryVariables
  >(InteractionMapDocument, {
    variables: {
      organizationId,
      startDate,
      endDate,
      dimension,
      regionCodes,
    },
    skip: !organizationId || !enabled,
  });

  const points = useMemo(() => data?.interactionMap?.points ?? [], [data]);
  const truncated = data?.interactionMap?.truncated ?? false;

  return { points, truncated, loading, error };
}
