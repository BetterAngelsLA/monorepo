import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { useMemo } from 'react';
import {
  InteractionMapDocument,
  type InteractionMapQuery,
  type InteractionMapQueryVariables,
} from './__generated__/regions.generated';

/** One interaction location, as returned by `interactionMap`. */
export type InteractionPointType = InteractionMapQuery['interactionMap']['points'][number];
/** One occupied grid cell of the density view. */
export type DensityCellType = InteractionMapQuery['interactionMap']['density'][number];

type UseInteractionMapArgs = {
  organizationId: string;
  startDate: string;
  endDate: string;
  dimension: RegionDimension;
  /**
   * Narrow the map to these regions of `dimension` — "show me the SPA 4 visits".
   * Empty means every interaction in range.
   */
  regionCodes: string[];
};

/**
 * Where the interactions were.
 *
 * Returns both representations of the same period — individual points and a
 * density grid — in one round trip, so switching between them on the map does not
 * refetch. `truncated` says the point cap was reached, which the UI must surface:
 * a partial map that looks complete is worse than no map.
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
      // Undefined rather than [] so the backend sees "no filter" instead of an
      // empty list, which would match nothing.
      regionCodes: regionCodes.length > 0 ? regionCodes : undefined,
    },
    skip: !organizationId,
  });

  const points = useMemo(
    () => data?.interactionMap?.points ?? [],
    [data],
  );
  const density = useMemo(
    () => data?.interactionMap?.density ?? [],
    [data],
  );
  const truncated = data?.interactionMap?.truncated ?? false;

  return { points, density, truncated, loading, error };
}
