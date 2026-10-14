import { useQuery } from '@apollo/client/react';
import { GetShelterOperatorProfileDocument } from './__generated__/useShelterOperatorProfile.generated';

/**
 * Fetches the profile data for a shelter, such as name, address, and
 * other general information that changes infrequently.
 *
 * For day-to-day operational data like bed/room inventory and availability,
 * use a separate dedicated hook instead.
 */
export function useShelterOperatorProfile(shelterId: string) {
  const { data, loading, error } = useQuery(GetShelterOperatorProfileDocument, {
    variables: { id: shelterId },
    skip: !shelterId,
  });

  return {
    shelter: data?.operatorShelter,
    loading,
    error,
  };
}
