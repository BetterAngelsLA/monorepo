import { getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { RoomStatusChoices } from '@monorepo/ba-platform/types';
import { toError } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCloneRoom,
  useDeleteRooms,
  useRooms,
  useUpdateRoom,
} from '../../hooks';
import { cloneRoomMeta } from '../../hooks/useCloneRoom/__generated__/useCloneRoom_meta.generated';
import { deleteRoomsMeta } from '../../hooks/useDeleteRooms/__generated__/useDeleteRooms_meta.generated';
import {
  shelterCreateReservationRoute,
  shelterCreateRoomRoute,
  shelterEditRoomRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { useToast } from '../base-ui/toast';
import { Room, RoomTable } from '../RoomTable';
import { updateRoomMeta } from './api/__generated__/roomMutations_meta.generated';

export function RoomsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { rooms: roomsData, loading } = useRooms(shelterId);

  const rooms: Room[] = roomsData.map((room) => ({
    id: room.id,
    name: room.name,
    status: room.status ?? RoomStatusChoices.Available,
  }));

  const { cloneRoom } = useCloneRoom({ shelterId });
  const { deleteRooms } = useDeleteRooms({ shelterId });
  const { updateRoom } = useUpdateRoom();

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
      const errorMessage = 'Unable to clone room. Please try again.';

      try {
        const response = await cloneRoom({ variables: { id: room.id } });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...cloneRoomMeta,
          fields: ['id'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error cloning room: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      }
    },
    [cloneRoom, showToast],
  );

  const handleEdit = useCallback(
    (room: Room) => {
      navigate(shelterEditRoomRoute(shelterId, room.id));
    },
    [navigate, shelterId],
  );
  const handleDeleteRequest = useCallback(
    (roomIds: string[], roomName?: string) => {
      setDeleteConfirmation({ isOpen: true, roomIds, roomName });
    },
    [],
  );

  const handleDelete = useCallback(
    async (ids: string[]) => {
      const plural = ids.length > 1 ? 's' : '';
      const errorMessage = `Unable to delete room${plural}. Please try again.`;

      try {
        const response = await deleteRooms({ variables: { data: { ids } } });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...deleteRoomsMeta,
          fields: ['ids'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error deleting room${plural}: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      }
    },
    [deleteRooms, showToast],
  );

  const handleMarkReady = useCallback(
    async (room: Room) => {
      const errorMessage = 'Unable to update room. Please try again.';

      try {
        const response = await updateRoom({
          variables: {
            id: room.id,
            data: { lastCleaned: new Date().toISOString() },
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...updateRoomMeta,
          fields: ['lastCleaned'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error updating room: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      }
    },
    [updateRoom, showToast],
  );
  const [readyConfirmation, setReadyConfirmation] = useState<{
    isOpen: boolean;
    room: Room | null;
  }>({ isOpen: false, room: null });

  const closeReadyConfirmation = useCallback(() => {
    setReadyConfirmation({ isOpen: false, room: null });
  }, []);

  const handleMarkReadyRequest = useCallback((room: Room) => {
    setReadyConfirmation({ isOpen: true, room });
  }, []);
  const handleReserve = useCallback(
    (room: Room) => {
      navigate(shelterCreateReservationRoute(shelterId), {
        state: { roomId: room.id },
      });
    },
    [navigate, shelterId],
  );
  const readyRoom = readyConfirmation.room;

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
          onMarkReady={handleMarkReadyRequest}
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
      {readyRoom && (
        <ConfirmationModal
          isOpen={readyConfirmation.isOpen}
          onClose={closeReadyConfirmation}
          variant="success"
          title="Mark bed as ready?"
          description="This will mark the bed as cleaned and ready for use."
          primaryAction={{
            label: 'Mark Ready',
            onClick: async () => {
              await handleMarkReady(readyRoom);
              closeReadyConfirmation();
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeReadyConfirmation,
          }}
        />
      )}

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
