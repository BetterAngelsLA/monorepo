import { useQuery } from '@apollo/client/react';
import {
  GetShelterDocument,
  GetShelterQuery,
} from '../graphql/__generated__/getShelter.generated';

export function useShelter(shelterId: string) {
  const { data, loading, error } = useQuery(GetShelterDocument, {
    variables: { id: shelterId },
    skip: !shelterId,
  });

  return {
    shelter: data?.shelter as GetShelterQuery['shelter'] | undefined,
    loading,
    error,
  };
}
