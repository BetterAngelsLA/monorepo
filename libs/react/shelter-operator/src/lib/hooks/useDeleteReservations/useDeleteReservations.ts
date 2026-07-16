import { useMutation } from '@apollo/client/react';

import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import { ReservationsDocument } from '../useReservations/__generated__/useReservations.generated';
import { RoomsDocument } from '../useRooms/__generated__/useRooms.generated';
import {
  DeleteReservationsDocument,
  DeleteReservationsMutation,
  DeleteReservationsMutationVariables,
} from './__generated__/useDeleteReservations.generated';
import { deleteReservationsSuccessTypename } from './__generated__/useDeleteReservations_meta.generated';

type TProps = {
  refetch?: boolean;
  shelterId: string;
};

export function useDeleteReservations(props: TProps) {
  const { refetch = true, shelterId } = props || {};

  const [deleteReservations, { loading, error }] = useMutation<
    DeleteReservationsMutation,
    DeleteReservationsMutationVariables
  >(DeleteReservationsDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.deleteReservations;

          if (payload?.__typename === deleteReservationsSuccessTypename) {
            return [
              { query: BedsDocument, variables: { shelterId } },
              { query: RoomsDocument, variables: { shelterId } },
              { query: ReservationsDocument, variables: { shelterId } },
            ];
          }

          return [];
        }
      : [],
  });

  return { deleteReservations, loading, error };
}
