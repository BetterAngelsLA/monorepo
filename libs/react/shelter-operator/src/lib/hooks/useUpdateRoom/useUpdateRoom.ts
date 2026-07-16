import { useMutation } from '@apollo/client/react';
import { UpdateRoomInput } from '../../apollo';
import { RoomDocument } from '../useRoom/__generated__/useRoom.generated';
import {
  UpdateRoomDocument,
  UpdateRoomMutation,
  UpdateRoomMutationVariables,
} from './__generated__/useUpdateRoom.generated';
import { updateRoomSuccessTypename } from './__generated__/useUpdateRoom_meta.generated';

type TProps = {
  refetch?: boolean;
};

export type UseUpdateRoomInput = UpdateRoomInput;

export function useUpdateRoom(props?: TProps) {
  const { refetch = true } = props || {};

  const [updateRoom, { loading, error }] = useMutation<
    UpdateRoomMutation,
    UpdateRoomMutationVariables
  >(UpdateRoomDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.updateRoom;

          if (payload?.__typename === updateRoomSuccessTypename) {
            return [
              {
                query: RoomDocument,
                variables: { id: payload.id },
              },
            ];
          }

          return [];
        }
      : [],
  });

  return { updateRoom, loading, error };
}
