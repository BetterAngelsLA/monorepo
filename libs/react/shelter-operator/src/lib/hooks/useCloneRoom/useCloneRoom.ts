import { useMutation } from '@apollo/client/react';
import { RoomsDocument } from '../useRooms/__generated__/useRooms.generated';
import {
  CloneRoomDocument,
  CloneRoomMutation,
  CloneRoomMutationVariables,
} from './__generated__/useCloneRoom.generated';
import { cloneRoomSuccessTypename } from './__generated__/useCloneRoom_meta.generated';

type TProps = {
  shelterId: string;
  refetch?: boolean;
};

export function useCloneRoom(props: TProps) {
  const { shelterId, refetch = true } = props || {};

  const [cloneRoom, { loading, error }] = useMutation<
    CloneRoomMutation,
    CloneRoomMutationVariables
  >(CloneRoomDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.cloneRoom;

          if (payload?.__typename === cloneRoomSuccessTypename) {
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

  return { cloneRoom, loading, error };
}
