import { useQuery } from '@apollo/client/react';
import {
  RegionDimensionsDocument,
  type RegionDimensionsQuery,
} from './__generated__/regions.generated';

/** One dimension as the API publishes it: the value, and the names to render it. */
export type RegionDimensionInfoType =
  RegionDimensionsQuery['regionDimensions'][number];

/**
 * One frozen instance for "nothing yet". A literal `[]` fallback is a new array identity on
 * every render, so every downstream `useMemo` keyed on `dimensions` recomputes while the query
 * is in flight. Frozen so a caller that writes to it fails loudly rather than corrupting the
 * shared instance.
 */
const EMPTY_DIMENSIONS: RegionDimensionInfoType[] = [];
Object.freeze(EMPTY_DIMENSIONS);

/** The dimensions a program manager can group the breakdown by, with their display names. */
export function useRegionDimensions() {
  const { data, loading, error } = useQuery(RegionDimensionsDocument);

  return {
    dimensions: data?.regionDimensions ?? EMPTY_DIMENSIONS,
    loading,
    error,
  };
}
