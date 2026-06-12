import { useQuery } from '@apollo/client/react';
import {
  GetRoomDocument,
  type GetRoomQuery,
  type GetRoomQueryVariables,
} from '../../components/rooms/api/__generated__/roomQueries.generated';

export function useRoom(roomId: string) {
  const { data, loading, error } = useQuery<
    GetRoomQuery,
    GetRoomQueryVariables
  >(GetRoomDocument, {
    variables: { id: roomId },
    skip: !roomId,
  });

  return {
    room: data?.room,
    loading,
    error,
  };
}
