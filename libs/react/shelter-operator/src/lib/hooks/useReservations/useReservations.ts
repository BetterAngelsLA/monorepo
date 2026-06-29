import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import type {
  GetReservationsQuery,
  GetReservationsQueryVariables,
} from './__generated__/useReservations.generated';

const GET_RESERVATIONS_QUERY = gql`
  query GetReservations($shelterId: ID!) {
    reservations(filters: { shelterId: $shelterId }) {
      results {
        id
        status
        startDate
        checkedInAt
        checkedOutAt
        bed {
          id
          name
        }
        room {
          id
          name
        }
        clients {
          id
          isPrimary
          clientProfile {
            id
            firstName
            middleName
            lastName
            nickname
          }
        }
      }
      totalCount
    }
  }
`;

export function useReservations(shelterId: string) {
  const { data, loading, error } = useQuery<
    GetReservationsQuery,
    GetReservationsQueryVariables
  >(GET_RESERVATIONS_QUERY, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const reservations = data?.reservations;

  return {
    reservations: reservations?.results ?? [],
    totalCount: reservations?.totalCount ?? 0,
    loading,
    error,
  };
}
