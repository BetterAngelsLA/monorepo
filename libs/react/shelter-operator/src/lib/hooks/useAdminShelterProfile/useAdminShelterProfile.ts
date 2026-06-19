import { useQuery } from '@apollo/client/react';
import { GetAdminShelterProfileDocument } from './__generated__/useAdminShelterProfile.generated';

/**
 * Fetches the profile data for a shelter, such as name, address, and
 * other general information that changes infrequently.
 *
 * For day-to-day operational data like bed/room inventory and availability,
 * use a separate dedicated hook instead.
 */
export function useAdminShelterProfile(shelterId: string) {
  const { data, loading, error } = useQuery(GetAdminShelterProfileDocument, {
    variables: { id: shelterId },
    skip: !shelterId,
  });

  return {
    shelter: data?.operatorShelter,
    loading,
    error,
  };
}
