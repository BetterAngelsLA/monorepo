import { useMutation, useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RoomStatusChoices,
  ShelterType,
  type RoomType,
} from '../../apollo/graphql/__generated__/types';
import {
  shelterCreateRoomRoute,
  shelterEditRoomRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { RoomTable, type RoomRowObject } from '../RoomTable';
import {
  DeleteRoomDocument,
  DuplicateRoomDocument,
  type DeleteRoomMutation,
  type DeleteRoomMutationVariables,
  type DuplicateRoomMutation,
  type DuplicateRoomMutationVariables,
} from './__generated__/roomMutations.generated';
import {
  GetShelterRoomsDocument,
  type GetShelterRoomsQuery,
  type GetShelterRoomsQueryVariables,
} from './__generated__/rooms.generated';

export function RoomsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<
    GetShelterRoomsQuery,
    GetShelterRoomsQueryVariables
  >(GetShelterRoomsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const [duplicateRoom] = useMutation<
    DuplicateRoomMutation,
    DuplicateRoomMutationVariables
  >(DuplicateRoomDocument);

  const [deleteRoom] = useMutation<
    DeleteRoomMutation,
    DeleteRoomMutationVariables
  >(DeleteRoomDocument);

  const rows: RoomType[] = (data?.rooms.results ?? []).map((room) => ({
    id: room.id,
    name: room.name,
    status: room.status ?? RoomStatusChoices.Available,
    amenities: room.amenities ?? '',
    medicalRespite: room.medicalRespite,
    __typename: 'RoomType',
    accessibility: [],
    beds: [],
    demographics: [],
    funders: [],
    maintenanceFlag: false,
    occupantIds: [],
    pets: [],
    shelter: {} as ShelterType,
    storage: false,
  }));

  const handleEdit = useCallback(
    (rowObject: RoomRowObject) => {
      navigate(shelterEditRoomRoute(shelterId, rowObject.id));
    },
    [navigate, shelterId]
  );

  const handleDuplicate = useCallback(
    async (rowObject: RoomRowObject) => {
      setActionError(null);
      try {
        const { data: result } = await duplicateRoom({
          variables: { id: rowObject.id, shelterId },
          errorPolicy: 'all',
        });

        const payload = result?.duplicateRoom;
        if (payload?.__typename === 'OperationInfo') {
          setActionError(
            payload.messages?.[0]?.message ||
              'Unable to duplicate room. Please try again.'
          );
          return;
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [duplicateRoom, refetch, shelterId]
  );

  const deleteOneRoom = useCallback(
    async (roomId: string) => {
      const { data: result } = await deleteRoom({
        variables: { id: roomId },
        errorPolicy: 'all',
        refetchQueries: [],
      });

      const payload = result?.deleteRoom;
      if (payload?.__typename === 'OperationInfo') {
        return (
          payload.messages?.[0]?.message ||
          'Unable to delete room. Please try again.'
        );
      }

      return null;
    },
    [deleteRoom]
  );

  const handleDeleteRoom = useCallback(
    async (roomId: string) => {
      setActionError(null);
      try {
        const error = await deleteOneRoom(roomId);
        if (error) {
          setActionError(error);
          return;
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [deleteOneRoom, refetch]
  );

  const handleDeleteRooms = useCallback(
    async (roomIds: string[]) => {
      setActionError(null);
      try {
        for (const roomId of roomIds) {
          const error = await deleteOneRoom(roomId);
          if (error) {
            setActionError(error);
            await refetch();
            return;
          }
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [deleteOneRoom, refetch]
  );

  return (
    <>
      {actionError ? (
        <div
          className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      <div>
        <RoomTable
          rows={rows}
          onRowClick={handleEdit}
          onDuplicate={handleDuplicate}
          onDeleteRoom={handleDeleteRoom}
          onDeleteRooms={handleDeleteRooms}
          loading={loading}
        />
      </div>
      <div className="fixed bottom-6 right-6 text-sm z-20 ">
        <Button
          leftIcon={<Plus />}
          rightIcon={false}
          variant="floating"
          onClick={() => navigate(shelterCreateRoomRoute(shelterId))}
        >
          Create Room
        </Button>
      </div>
    </>
  );
}
