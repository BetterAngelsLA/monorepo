import { useQuery } from '@apollo/client/react';
import {
  ShelterOrganizationsDocument,
  ShelterOrganizationsQuery,
} from './__generated__/useShelterOrganizations.generated';

export type UseShelterOrganizationsResultType =
  ShelterOrganizationsQuery['shelterOrganizations']['results'];

type UseShelterOrganizationsOptions = {
  /** Skip the query entirely (e.g. when the consumer is not rendered). */
  skip?: boolean;
};

export function useShelterOrganizations(
  options?: UseShelterOrganizationsOptions,
) {
  const { data, loading, error } = useQuery(ShelterOrganizationsDocument, {
    skip: options?.skip,
  });

  return {
    organizations: data?.shelterOrganizations.results ?? [],
    loading,
    error,
  };
}
