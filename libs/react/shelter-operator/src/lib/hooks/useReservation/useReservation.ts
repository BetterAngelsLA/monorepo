import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import type {
  GetReservationQuery,
  GetReservationQueryVariables,
} from './__generated__/useReservation.generated';

const GET_RESERVATION_QUERY = gql`
  query GetReservation($pk: ID!) {
    reservation(pk: $pk) {
      id
      status
      startDate
      notes
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
  }
`;

export function useReservation(reservationId: string) {
  const { data, loading, error } = useQuery<
    GetReservationQuery,
    GetReservationQueryVariables
  >(GET_RESERVATION_QUERY, {
    variables: { pk: reservationId },
    skip: !reservationId,
  });

  return {
    reservation: data?.reservation,
    loading,
    error,
  };
}
