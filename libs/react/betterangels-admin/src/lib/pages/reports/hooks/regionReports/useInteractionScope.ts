import { useQuery } from '@apollo/client/react';
import {
  InteractionScopeDocument,
  type InteractionScopeQuery,
  type InteractionScopeQueryVariables,
} from './__generated__/regions.generated';

type UseInteractionScopeArgs = {
  organizationId: string;
  startDate: string;
  endDate: string;
  /** False while the map is off screen or there is no key, which holds the request back. */
  enabled?: boolean;
};

/**
 * Whether the caller may see individual interactions for this window.
 *
 * The density view draws no points, and a cell-free tile is a **204** whether the range was
 * quiet or the note scope withheld it — an MVT has no field to say which. This is that one
 * answer without the payload `interactionMap` would carry: the organization and the window are
 * all it depends on, because `withheld` is computed before any region filter.
 *
 * The previous answer is held across a variables change for the same reason the points and the
 * rollup rows are: a refetch would otherwise flash "not withheld" over a refusal.
 */
export function useInteractionScope({
  organizationId,
  startDate,
  endDate,
  enabled = true,
}: UseInteractionScopeArgs) {
  const { data, previousData, loading, error } = useQuery<
    InteractionScopeQuery,
    InteractionScopeQueryVariables
  >(InteractionScopeDocument, {
    variables: { organizationId, startDate, endDate },
    skip: !organizationId || !enabled,
  });

  const active = data ?? previousData;

  return {
    withheld: active?.interactionScope?.withheld ?? false,
    loading,
    error,
  };
}
