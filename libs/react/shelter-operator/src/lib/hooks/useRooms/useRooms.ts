import { useQuery } from '@apollo/client/react';
import {
  RoomsDocument,
  type RoomsQuery,
  type RoomsQueryVariables,
} from './__generated__/useRooms.generated';

export type UseRoomsResultType = RoomsQuery['rooms']['results'];

export function useRooms(shelterId: string) {
  const { data, loading, error, refetch } = useQuery<
    RoomsQuery,
    RoomsQueryVariables
  >(RoomsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  return {
    rooms: data?.rooms.results ?? [],
    loading,
    error,
    refetch,
  };
}
