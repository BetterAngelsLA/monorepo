import { useQuery } from '@apollo/client/react';
import {
  BedsDocument,
  type BedsQuery,
  type BedsQueryVariables,
} from './__generated__/useBeds.generated';

export type UseBedsResultItemType = NonNullable<
  BedsQuery['beds']['results']
>[number];

export type UseBedsResultType = UseBedsResultItemType[];

export function useBeds(shelterId: string) {
  const { data, loading, error, refetch } = useQuery<
    BedsQuery,
    BedsQueryVariables
  >(BedsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  return {
    beds: data?.beds.results ?? [],
    loading,
    error,
    refetch,
  };
}
