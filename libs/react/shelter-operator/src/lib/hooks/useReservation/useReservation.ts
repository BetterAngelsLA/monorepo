import { useQuery } from '@apollo/client/react';
import {
  GetReservationDocument,
  type GetReservationQuery,
  type GetReservationQueryVariables,
} from '../../components/reservations/api/__generated__/reservationQueries.generated';

export function useReservation(reservationId: string) {
  const { data, loading, error } = useQuery<
    GetReservationQuery,
    GetReservationQueryVariables
  >(GetReservationDocument, {
    variables: { pk: reservationId },
    skip: !reservationId,
  });

  return {
    reservation: data?.reservation,
    loading,
    error,
  };
}
