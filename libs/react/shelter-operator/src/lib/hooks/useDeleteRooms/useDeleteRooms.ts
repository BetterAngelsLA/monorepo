import { useMutation } from '@apollo/client/react';

import { BedsDocument } from '../useBeds/__generated__/useBeds.generated';
import { RoomsDocument } from '../useRooms/__generated__/useRooms.generated';
import {
  DeleteRoomsDocument,
  DeleteRoomsMutation,
  DeleteRoomsMutationVariables,
} from './__generated__/useDeleteRooms.generated';

type TProps = {
  refetch?: boolean;
  shelterId: string;
};

export function useDeleteRooms(props: TProps) {
  const { refetch = true, shelterId } = props || {};

  const [deleteRooms, { loading, error }] = useMutation<
    DeleteRoomsMutation,
    DeleteRoomsMutationVariables
  >(DeleteRoomsDocument, {
    errorPolicy: 'all',
    refetchQueries: refetch
      ? (result) => {
          const payload = result.data?.deleteRooms;

          if (payload?.__typename === 'BulkDeleteResult') {
            return [
              { query: BedsDocument, variables: { shelterId } },
              { query: RoomsDocument, variables: { shelterId } },
            ];
          }

          return [];
        }
      : [],
  });

  return { deleteRooms, loading, error };
}
