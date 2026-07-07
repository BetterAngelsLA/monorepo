import { useMutation } from '@apollo/client/react';
import { RoomDocument } from '../useRoom/__generated__/useRoom.generated';
import {
  CloneRoomDocument,
  CloneRoomMutation,
  CloneRoomMutationVariables,
} from './__generated__/useCloneRoom.generated';

type TProps = {
  refetch?: boolean;
};

export function useCloneRoom(props?: TProps) {
  const { refetch = true } = props || {};

  const [cloneRoom, { loading, error }] = useMutation<
    CloneRoomMutation,
    CloneRoomMutationVariables
  >(CloneRoomDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.cloneRoom;

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

  return { cloneRoom, loading, error };
}
