import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  GetShelterPropertiesQuery,
  GetShelterPropertiesQueryVariables,
} from './__generated__/useShelterProperties.generated';

const GET_SHELTER_PROPERTIES_QUERY = gql`
  query GetShelterProperties($pk: ID!) {
    operatorShelter(pk: $pk) {
      id
      accessibility {
        name
      }
      demographics {
        name
      }
      funders {
        name
      }
      pets {
        name
      }
    }
  }
`;

export function useShelterProperties(shelterId: string) {
  const { data, loading, error } = useQuery<
    GetShelterPropertiesQuery,
    GetShelterPropertiesQueryVariables
  >(GET_SHELTER_PROPERTIES_QUERY, {
    variables: { pk: shelterId },
    skip: !shelterId,
  });

  return {
    shelterProperties: data?.operatorShelter,
    loading,
    error,
  };
}
