import { useQuery } from '@apollo/client/react';
import {
  ShelterCitiesDocument,
  ShelterCitiesQuery,
} from './__generated__/useShelterCities.generated';

export type UseShelterCitiesResultType =
  ShelterCitiesQuery['shelterCities']['results'];

export function useShelterCities() {
  const { data, loading, error } = useQuery(ShelterCitiesDocument);

  return {
    cities: data?.shelterCities.results || [],
    loading,
    error,
  };
}
