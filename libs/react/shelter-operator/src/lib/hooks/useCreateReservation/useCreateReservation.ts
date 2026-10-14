import { useMutation } from '@apollo/client/react';
import { CreateReservationInput } from '../../apollo';
import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import { ReservationsDocument } from '../useReservations/__generated__/useReservations.generated';
import { RoomsDocument } from '../useRooms/__generated__/useRooms.generated';
import {
  CreateReservationDocument,
  CreateReservationMutation,
  CreateReservationMutationVariables,
} from './__generated__/useCreateReservation.generated';
import { createReservationSuccessTypename } from './__generated__/useCreateReservation_meta.generated';

type TProps = {
  refetch?: boolean;
  shelterId: string;
};

export type UseCreateReservationInput = CreateReservationInput;

export function useCreateReservation(props: TProps) {
  const { shelterId, refetch = true } = props || {};

  const [createReservation, { loading, error }] = useMutation<
    CreateReservationMutation,
    CreateReservationMutationVariables
  >(CreateReservationDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.createReservation;

          if (payload?.__typename === createReservationSuccessTypename) {
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

  return { createReservation, loading, error };
}
