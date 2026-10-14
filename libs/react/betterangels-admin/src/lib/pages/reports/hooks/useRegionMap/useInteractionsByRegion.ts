import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import {
  InteractionsByRegionDocument,
  type InteractionsByRegionQuery,
  type InteractionsByRegionQueryVariables,
} from './__generated__/regions.generated';

/**
 * The generated operations export their whole `Query` type rather than per-field
 * types (the config only generates operations here; base types live in
 * `@monorepo/ba-platform/types`), so the row type is derived from it.
 */
export type RegionCountType =
  InteractionsByRegionQuery['interactionsByRegion'][number];

type UseInteractionsByRegionArgs = {
  organizationId: string;
  /** Absent means every dimension at once; buckets then carry their own `kind`. */
  dimension?: RegionDimension;
  startDate: string;
  endDate: string;
  /** Narrow the rollup to these regions, matching the map's drill-down. */
  regionCodes?: string[];
};

/**
 * Interactions grouped by geography. The API returns the unassigned buckets as
 * rows with `isUnassigned` set rather than omitting them, so that a client
 * outside every boundary is visible instead of silently dropped.
 */
export function useInteractionsByRegion({
  organizationId,
  dimension,
  startDate,
  endDate,
  regionCodes,
}: UseInteractionsByRegionArgs) {
  const { data, loading, error } = useQuery<
    InteractionsByRegionQuery,
    InteractionsByRegionQueryVariables
  >(InteractionsByRegionDocument, {
    variables: { organizationId, dimension, startDate, endDate, regionCodes },
    skip: !organizationId,
  });

  return {
    rows: data?.interactionsByRegion ?? [],
    loading,
    error,
  };
}
