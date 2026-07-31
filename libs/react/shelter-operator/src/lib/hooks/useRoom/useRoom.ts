import { useQuery } from '@apollo/client/react';
import {
  RoomDocument,
  type RoomQuery,
  type RoomQueryVariables,
} from './__generated__/useRoom.generated';

export type UseRoomResultType = RoomQuery['room'];

export function useRoom(roomId: string) {
  const { data, loading, error } = useQuery<RoomQuery, RoomQueryVariables>(
    RoomDocument,
    {
      variables: { id: roomId },
      skip: !roomId,
    }
  );

  return {
    room: data?.room,
    loading,
    error,
  };
}
