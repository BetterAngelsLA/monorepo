import { useQuery } from '@apollo/client/react';
import { RegionDimensionsDocument } from './__generated__/regions.generated';

/** The dimensions a program manager can group the breakdown by. */
export function useRegionDimensions() {
  const { data, loading, error } = useQuery(RegionDimensionsDocument);

  return {
    dimensions: data?.regionDimensions ?? [],
    loading,
    error,
  };
}
