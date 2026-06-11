import { useMutation, useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RoomStatusChoices,
  ShelterType,
  type RoomType,
} from '../../apollo/graphql/__generated__/types';
import { shelterCreateRoomRoute, shelterEditRoomRoute } from '../../routing';
import { Button } from '../base-ui/buttons';
import { RoomTable, type RoomRowObject } from '../RoomTable';
import {
  CloneRoomDocument,
  DeleteRoomsDocument,
  type CloneRoomMutation,
  type CloneRoomMutationVariables,
  type DeleteRoomsMutation,
  type DeleteRoomsMutationVariables,
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

  const [cloneRoom] = useMutation<
    CloneRoomMutation,
    CloneRoomMutationVariables
  >(CloneRoomDocument);

  const [deleteRooms] = useMutation<
    DeleteRoomsMutation,
    DeleteRoomsMutationVariables
  >(DeleteRoomsDocument);

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

  const handleClone = useCallback(
    async (rowObject: RoomRowObject) => {
      setActionError(null);
      try {
        const { data: result } = await cloneRoom({
          variables: { id: rowObject.id, shelterId },
          errorPolicy: 'all',
        });

        const payload = result?.cloneRoom;
        if (payload?.__typename === 'OperationInfo') {
          setActionError(
            payload.messages?.[0]?.message ||
              'Unable to clone room. Please try again.'
          );
          return;
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [cloneRoom, refetch, shelterId]
  );

  const handleDeleteRooms = useCallback(
    async (roomIds: string[]) => {
      setActionError(null);
      try {
        await deleteRooms({ variables: { data: { ids: roomIds } } });
        await refetch();
      } catch (e) {
        setActionError(
          e instanceof Error
            ? e.message
            : 'Unable to delete room(s). Please try again.'
        );
      }
    },
    [deleteRooms, refetch]
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
          onClone={handleClone}
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
