import { useQuery } from '@apollo/client/react';
import {
  ReservationsDocument,
  type ReservationsQuery,
  type ReservationsQueryVariables,
} from './__generated__/useReservations.generated';

export type UseReservationsResultType =
  ReservationsQuery['reservations']['results'][number];

export function useReservations(shelterId: string) {
  const { data, loading, error } = useQuery<
    ReservationsQuery,
    ReservationsQueryVariables
  >(ReservationsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  return {
    reservations: data?.reservations.results ?? [],
    totalCount: data?.reservations?.totalCount ?? 0,
    loading,
    error,
  };
}
