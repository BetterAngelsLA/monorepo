import { extractOperationInfoMessage, toError } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OperatorShelterType,
  RoomStatusChoices,
  type RoomType,
} from '../../apollo/graphql/__generated__/types';
import { useCloneRoom } from '../../hooks/useCloneRoom';
import { useDeleteRooms } from '../../hooks/useDeleteRooms';
import { useRooms } from '../../hooks/useRooms';
import {
  shelterCreateReservationRoute,
  shelterCreateRoomRoute,
  shelterEditRoomRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { RoomTable, type Room } from '../RoomTable';

export function RoomsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { rooms: roomsData, loading, refetch } = useRooms(shelterId);

  const rooms: RoomType[] = roomsData.map((room) => ({
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

  const { cloneRoom } = useCloneRoom();
  const [cloneError, setCloneError] = useState<string | null>(null);

  const { deleteRooms } = useDeleteRooms({ shelterId });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    roomIds: string[];
    roomName?: string;
  }>({ isOpen: false, roomIds: [], roomName: '' });

  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, roomIds: [], roomName: '' });
  }, []);

  const deleteConfirmationTitle =
    deleteConfirmation.roomIds.length === 1
      ? `Are you sure you want to delete ${deleteConfirmation.roomName}?`
      : `Are you sure you want to delete the ${deleteConfirmation.roomIds.length} selected rooms?`;

  const handleClone = useCallback(
    async (room: Room) => {
      const errorMsg = 'Unable to clone room. Please try again.';
      setCloneError(null);
      try {
        const response = await cloneRoom({ variables: { id: room.id } });
        const errorMessage = extractOperationInfoMessage(response, 'cloneRoom');
        if (errorMessage) {
          console.error(`error cloning room: ${errorMessage}`);
          setCloneError(errorMsg);
          return;
        }
        await refetch();
      } catch (err) {
        const error = toError(err);

        console.error(`error cloning room: ${error.message}`);
        setCloneError(errorMsg);
      }
    },
    [cloneRoom, refetch]
  );

  const handleDeleteRequest = useCallback(
    (roomIds: string[], roomName?: string) => {
      setDeleteConfirmation({ isOpen: true, roomIds, roomName });
    },
    []
  );
  const handleEdit = useCallback(
    (room: Room) => {
      navigate(shelterEditRoomRoute(shelterId, room.id));
    },
    [navigate, shelterId]
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      const plural = ids.length > 1 ? 's' : '';
      const errorMsg = `Unable to delete room${plural}. Please try again.`;
      setDeleteError(null);
      try {
        const response = await deleteRooms({
          variables: { data: { ids: ids } },
        });
        const errorMessage = extractOperationInfoMessage(
          response,
          'deleteRooms'
        );
        if (errorMessage) {
          console.error(`error deleting room${plural}: ${errorMessage}`);
          setDeleteError(errorMsg);
          return;
        }
        await refetch();
      } catch (err) {
        const error = toError(err);

        console.error(`error deleting room${plural}: ${error.message}`);
        setDeleteError(errorMsg);
      }
    },
    [deleteRooms, refetch]
  );

  const handleReserve = useCallback(
    (room: Room) => {
      navigate(shelterCreateReservationRoute(shelterId), {
        state: { roomId: room.id },
      });
    },
    [navigate, shelterId]
  );

  return (
    <>
      {(cloneError || deleteError) && (
        <div
          className="mx-4 mt-4 flex items-start rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span className="flex-1">{cloneError || deleteError}</span>
          <button
            onClick={() => {
              setCloneError(null);
              setDeleteError(null);
            }}
            className="ml-3 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div>
        <RoomTable
          rooms={rooms}
          onEdit={handleEdit}
          onClone={handleClone}
          onDeleteRooms={(roomIds, roomName) =>
            handleDeleteRequest(roomIds, roomName)
          }
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
          onClick: () => {
            if (deleteConfirmation.roomIds.length > 0) {
              handleDelete(deleteConfirmation.roomIds);
            }
            closeDeleteConfirmation();
          },
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
