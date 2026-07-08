import { useMutation } from '@apollo/client/react';
import { UpdateReservationInput } from '../../apollo';
import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import { ReservationsDocument } from '../useReservations/__generated__/useReservations.generated';
import { RoomsDocument } from '../useRooms/__generated__/useRooms.generated';
import {
  UpdateReservationDocument,
  UpdateReservationMutation,
  UpdateReservationMutationVariables,
} from './__generated__/useUpdateReservation.generated';

type TProps = {
  refetch?: boolean;
  shelterId: string;
};

export type UseUpdateReservationInput = UpdateReservationInput;

export function useUpdateReservation(props: TProps) {
  const { shelterId, refetch = true } = props || {};

  const [updateReservation, { loading, error }] = useMutation<
    UpdateReservationMutation,
    UpdateReservationMutationVariables
  >(UpdateReservationDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.updateReservation;

          if (payload?.__typename === 'ReservationType') {
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

  return { updateReservation, loading, error };
}
