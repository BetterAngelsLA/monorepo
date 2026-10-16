import { useQuery } from '@apollo/client/react';
import type { RegionDimension } from '@monorepo/ba-platform/types';
import { RegionDimensionsDocument } from './__generated__/regions.generated';

/**
 * One frozen instance for "nothing yet". A literal `[]` fallback is a new array identity on
 * every render, so every downstream `useMemo` keyed on `dimensions` recomputes while the query
 * is in flight. Frozen so a caller that writes to it fails loudly rather than corrupting the
 * shared instance.
 */
const EMPTY_DIMENSIONS: RegionDimension[] = [];
Object.freeze(EMPTY_DIMENSIONS);

/** The dimensions a program manager can group the breakdown by. */
export function useRegionDimensions() {
  const { data, loading, error } = useQuery(RegionDimensionsDocument);

  return {
    dimensions: data?.regionDimensions ?? EMPTY_DIMENSIONS,
    loading,
    error,
  };
}
