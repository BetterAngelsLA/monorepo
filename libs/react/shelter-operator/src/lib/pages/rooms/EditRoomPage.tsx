import { useNavigate, useParams } from 'react-router-dom';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { RoomForm } from '../../components/rooms/room-form/RoomForm';
import { mapRoomToFormData } from '../../components/rooms/room-form/utils/mapRoomToFormData';
import { useRoom } from '../../hooks/useRoom';
import { shelterManageRoomsRoute } from '../../routing';

export function EditRoomPage() {
  const navigate = useNavigate();
  const { shelterId, roomId } = useParams();
  const { room, loading, error } = useRoom(roomId ?? '');

  const roomsPath = shelterManageRoomsRoute(shelterId ?? '');

  if (!roomId) {
    return null;
  }

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={roomsPath}
      backLinkLabel="Back to Rooms"
      entityId={roomId}
      loading={loading}
      hasError={!!(error || !room)}
      errorMessage={error ? 'Unable to load this room.' : 'Room not found.'}
      entityName="room"
      entityLabel="Room"
      createSubtitle="Fields left blank will use defaults where applicable."
    >
      <RoomForm
        key={roomId}
        shelterId={shelterId ?? ''}
        roomId={roomId}
        initialData={room ? mapRoomToFormData(room) : undefined}
        onSuccess={() => navigate(roomsPath)}
        onCancel={() => navigate(roomsPath)}
      />
    </ManageFormPageLayout>
  );
}
