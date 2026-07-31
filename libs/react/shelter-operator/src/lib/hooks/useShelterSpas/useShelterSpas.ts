import { useQuery } from '@apollo/client/react';
import {
  ShelterSpasDocument,
  ShelterSpasQuery,
} from './__generated__/useShelterSpas.generated';

export type UseShelterSpasResultType =
  ShelterSpasQuery['shelterSpas']['results'];

export function useShelterSpas() {
  const { data, loading, error } = useQuery(ShelterSpasDocument);

  return {
    spas: data?.shelterSpas.results || [],
    loading,
    error,
  };
}
