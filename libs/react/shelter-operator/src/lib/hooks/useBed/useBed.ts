import { useQuery } from '@apollo/client/react';
import {
  BedDocument,
  type BedQuery,
  type BedQueryVariables,
} from './__generated__/useBed.generated';

export type UseBedResultType = BedQuery['bed'];

export function useBed(bedId: string) {
  const { data, loading, error } = useQuery<BedQuery, BedQueryVariables>(
    BedDocument,
    {
      variables: { id: bedId },
      skip: !bedId,
    }
  );

  return {
    bed: data?.bed,
    loading,
    error,
  };
}
