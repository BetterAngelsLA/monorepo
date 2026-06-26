import { useMutation, useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OperatorShelterType,
  RoomStatusChoices,
  type RoomType,
} from '../../apollo/graphql/__generated__/types';
import {
  shelterCreateReservationRoute,
  shelterCreateRoomRoute,
  shelterEditRoomRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { RoomTable, type RoomRowObject } from '../RoomTable';
import {
  CloneRoomDocument,
  DeleteRoomsDocument,
  type CloneRoomMutation,
  type CloneRoomMutationVariables,
  type DeleteRoomsMutation,
  type DeleteRoomsMutationVariables,
} from './api/__generated__/roomMutations.generated';
import {
  GetRoomsDocument,
  type GetRoomsQuery,
  type GetRoomsQueryVariables,
} from './api/__generated__/roomQueries.generated';

export function RoomsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    roomIds: string[];
    roomName?: string;
  }>({ isOpen: false, roomIds: [] });

  const { data, loading, refetch } = useQuery<
    GetRoomsQuery,
    GetRoomsQueryVariables
  >(GetRoomsDocument, {
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
    shelter: {} as OperatorShelterType,
    storage: false,
  }));

  const handleDeleteRequest = useCallback(
    (roomIds: string[], roomName?: string) => {
      setDeleteConfirmation({ isOpen: true, roomIds, roomName });
    },
    []
  );

  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, roomIds: [] });
  }, []);

  const confirmDelete = useCallback(async () => {
    setActionError(null);
    try {
      await deleteRooms({
        variables: { data: { ids: deleteConfirmation.roomIds } },
      });
      await refetch();
    } catch (e) {
      setActionError(
        e instanceof Error
          ? e.message
          : 'Unable to delete room(s). Please try again.'
      );
    }
    closeDeleteConfirmation();
  }, [
    deleteConfirmation.roomIds,
    deleteRooms,
    refetch,
    closeDeleteConfirmation,
  ]);

  const deleteConfirmationTitle = deleteConfirmation.roomName
    ? `Are you sure you want to delete ${deleteConfirmation.roomName}?`
    : 'Are you sure you want to delete the selected room?';

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
          variables: { id: rowObject.id },
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
    [cloneRoom, refetch]
  );

  const handleReserve = useCallback(
    (rowObject: RoomRowObject) => {
      navigate(shelterCreateReservationRoute(shelterId), {
        state: { roomId: rowObject.id },
      });
    },
    [navigate, shelterId]
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
          onDeleteRooms={(roomIds) => handleDeleteRequest(roomIds)}
          onReserve={handleReserve}
          loading={loading}
        />
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        variant="danger"
        title={deleteConfirmationTitle}
        description="This action cannot be undone."
        primaryAction={{
          label: 'Delete',
          onClick: confirmDelete,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeDeleteConfirmation,
        }}
      />

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
