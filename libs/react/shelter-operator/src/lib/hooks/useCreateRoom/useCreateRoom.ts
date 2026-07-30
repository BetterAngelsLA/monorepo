import { useMutation } from '@apollo/client/react';
import { CreateRoomInput } from '../../apollo';
import { RoomsDocument } from '../useRooms/__generated__/useRooms.generated';
import {
  CreateRoomDocument,
  CreateRoomMutation,
  CreateRoomMutationVariables,
} from './__generated__/useCreateRoom.generated';
import { createRoomSuccessTypename } from './__generated__/useCreateRoom_meta.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export type UseCreateRoomInput = CreateRoomInput;

export function useCreateRoom(props: TProps) {
  const { shelterId, refetch = true } = props || {};

  const [createRoom, { loading, error }] = useMutation<
    CreateRoomMutation,
    CreateRoomMutationVariables
  >(CreateRoomDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.createRoom;

          if (payload?.__typename === createRoomSuccessTypename) {
            return [
              {
                query: RoomsDocument,
                variables: { shelterId },
              },
            ];
          }

          return [];
        }
      : [],
  });

  return { createRoom, loading, error };
}
