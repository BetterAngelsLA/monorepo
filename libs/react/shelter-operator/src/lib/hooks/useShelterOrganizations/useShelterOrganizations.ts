import { useQuery } from '@apollo/client/react';
import {
  ShelterOrganizationsDocument,
  ShelterOrganizationsQuery,
} from './__generated__/useShelterOrganizations.generated';

export type UseShelterOrganizationsResultType =
  ShelterOrganizationsQuery['shelterOrganizations']['results'];

export function useShelterOrganizations() {
  const { data, loading, error } = useQuery(ShelterOrganizationsDocument);

  return {
    organizations: data?.shelterOrganizations.results ?? [],
    loading,
    error,
  };
}
