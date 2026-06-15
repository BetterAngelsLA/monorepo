import { useQuery } from '@apollo/client/react';
import {
  GetBedDocument,
  type GetBedQuery,
  type GetBedQueryVariables,
} from '../../components/beds/api/__generated__/bedQueries.generated';

export function useBed(bedId: string) {
  const { data, loading, error } = useQuery<GetBedQuery, GetBedQueryVariables>(
    GetBedDocument,
    {
      variables: { id: bedId },
      skip: !bedId,
    }
  );

  return {
    bed: data?.beds.results?.[0],
    loading,
    error,
  };
}
