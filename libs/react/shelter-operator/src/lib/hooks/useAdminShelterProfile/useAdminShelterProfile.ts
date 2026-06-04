import { useQuery } from '@apollo/client/react';
import { GetAdminShelterProfileDocument } from './__generated__/useAdminShelterProfile.generated';

export function useAdminShelterProfile(shelterId: string) {
  const { data, loading, error } = useQuery(GetAdminShelterProfileDocument, {
    variables: { id: shelterId },
    skip: !shelterId,
  });

  return {
    shelter: data?.adminShelter,
    loading,
    error,
  };
}
