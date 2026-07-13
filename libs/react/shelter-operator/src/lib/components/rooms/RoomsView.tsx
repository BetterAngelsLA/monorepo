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
import {
  cloneRoomOperationKey,
  cloneRoomSuccessTypename,
} from '../../hooks/useCloneRoom/__generated__/useCloneRoom_meta.generated';
import { useDeleteRooms } from '../../hooks/useDeleteRooms';
import {
  deleteRoomsOperationKey,
  deleteRoomsSuccessTypename,
} from '../../hooks/useDeleteRooms/__generated__/useDeleteRooms_meta.generated';
import { useRooms } from '../../hooks/useRooms';
import {
  shelterCreateReservationRoute,
  shelterCreateRoomRoute,
  shelterEditRoomRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { useToast } from '../base-ui/toast';
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
  const { deleteRooms } = useDeleteRooms({ shelterId });
  const { showToast } = useToast();
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
      try {
        const response = await cloneRoom({ variables: { id: room.id } });
        const errorMessage = extractOperationInfoMessage(
          response,
          cloneRoomOperationKey
        );
        if (errorMessage) {
          console.error(`error cloning room: ${errorMessage}`);
          showToast({ status: 'error', title: errorMsg, persistent: true });
          return;
        }
        if (response.data?.cloneRoom?.__typename !== cloneRoomSuccessTypename) {
          console.error('error cloning room: unexpected response');
          showToast({ status: 'error', title: errorMsg, persistent: true });
          return;
        }
      } catch (err) {
        const error = toError(err);

        console.error(`error cloning room: ${error.message}`);
        showToast({ status: 'error', title: errorMsg, persistent: true });
      }
    },
    [cloneRoom, showToast]
  );

  const handleEdit = useCallback(
    (room: Room) => {
      navigate(shelterEditRoomRoute(shelterId, room.id));
    },
    [navigate, shelterId]
  );
  const handleDeleteRequest = useCallback(
    (roomIds: string[], roomName?: string) => {
      setDeleteConfirmation({ isOpen: true, roomIds, roomName });
    },
    []
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      const plural = ids.length > 1 ? 's' : '';
      const errorMsg = `Unable to delete bed${plural}. Please try again.`;

      try {
        const response = await deleteRooms({
          variables: { data: { ids } },
        });
        const errorMessage = extractOperationInfoMessage(
          response,
          deleteRoomsOperationKey
        );
        if (errorMessage) {
          console.error(`error deleting bed${plural}: ${errorMessage}`);
          showToast({ status: 'error', title: errorMsg, persistent: true });
          return;
        }
        if (
          response.data?.deleteRooms?.__typename !== deleteRoomsSuccessTypename
        ) {
          console.error(`error deleting bed${plural}: unexpected response`);
          showToast({ status: 'error', title: errorMsg, persistent: true });
          return;
        }
      } catch (err) {
        const error = toError(err);

        console.error(`error deleting bed${plural}: ${error.message}`);
        showToast({ status: 'error', title: errorMsg, persistent: true });
      }
    },
    [deleteRooms, showToast]
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
          onClick: async () => {
            await handleDelete(deleteConfirmation.roomIds);
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
