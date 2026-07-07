import { useMutation } from '@apollo/client/react';
import { CreateRoomInput } from '../../apollo';
import { RoomDocument } from '../useRoom/__generated__/useRoom.generated';
import {
  CreateRoomDocument,
  CreateRoomMutation,
  CreateRoomMutationVariables,
} from './__generated__/useCreateRoom.generated';

type TProps = {
  refetch?: boolean;
};

export type UseCreateRoomInput = CreateRoomInput;

export function useCreateRoom(props?: TProps) {
  const { refetch = true } = props || {};

  const [createRoom, { loading, error }] = useMutation<
    CreateRoomMutation,
    CreateRoomMutationVariables
  >(CreateRoomDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.createRoom;

          if (payload?.__typename === 'RoomType') {
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

  return { createRoom, loading, error };
}
