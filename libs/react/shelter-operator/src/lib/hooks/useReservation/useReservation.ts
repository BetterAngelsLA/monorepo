import { useQuery } from '@apollo/client/react';
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
} from './__generated__/useReservation.generated';

export type UseReservationResultType = ReservationQuery['reservation'];

export function useReservation(reservationId: string) {
  const { data, loading, error } = useQuery<
    ReservationQuery,
    ReservationQueryVariables
  >(ReservationDocument, {
    variables: { id: reservationId },
    skip: !reservationId,
  });

  return {
    reservation: data?.reservation,
    loading,
    error,
  };
}
