import { useNavigate, useParams } from 'react-router-dom';
import {
  RoomForm,
  toFormData,
} from '../../components/ShelterManagement/segments/Rooms';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { useRoom } from '../../hooks/useRoom';
import { shelterMgmtResourceRoute } from '../../routing';

export function EditRoomPage() {
  const navigate = useNavigate();
  const { shelterId, id: roomId } = useParams<{
    shelterId: string;
    id: string;
  }>();

  if (!shelterId || !roomId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const { room, loading, error } = useRoom(roomId);
  const roomsPath = shelterMgmtResourceRoute(shelterId, 'room');

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
    >
      <RoomForm
        key={roomId}
        shelterId={shelterId}
        roomId={roomId}
        initialData={room ? toFormData(room) : undefined}
        onSuccess={() => navigate(roomsPath)}
        onCancel={() => navigate(roomsPath)}
      />
    </ManageFormPageLayout>
  );
}
