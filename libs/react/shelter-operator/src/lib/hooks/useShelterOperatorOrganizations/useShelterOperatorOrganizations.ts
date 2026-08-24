import { useQuery } from '@apollo/client/react';
import {
  ShelterOperatorOrganizationsDocument,
  ShelterOperatorOrganizationsQuery,
} from './__generated__/useShelterOperatorOrganizations.generated';

export type UseShelterOperatorOrganizationsResultType =
  ShelterOperatorOrganizationsQuery['shelterOperatorOrganizations']['results'];

export function useShelterOperatorOrganizations() {
  const { data, loading, error } = useQuery(
    ShelterOperatorOrganizationsDocument,
  );

  return {
    organizations: data?.shelterOperatorOrganizations.results ?? [],
    loading,
    error,
  };
}
