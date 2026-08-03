import { useNavigate, useParams } from 'react-router-dom';
import { RoomForm } from '../../components/ShelterManagement';
import { ManageFormPageLayout } from '../../components/manage-form-page-layout';
import { shelterMgmtResourceRoute } from '../../routing';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  const roomsPath = shelterMgmtResourceRoute(shelterId, 'room');

  return (
    <ManageFormPageLayout
      shelterId={shelterId}
      backLinkPath={roomsPath}
      backLinkLabel="Back to Rooms"
      entityId={undefined}
      loading={false}
      hasError={false}
      entityName="room"
      entityLabel="Room"
      createSubtitle="Fields left blank will use defaults where applicable."
    >
      <RoomForm
        shelterId={shelterId}
        onSuccess={() => navigate(roomsPath)}
        onCancel={() => navigate(roomsPath)}
      />
    </ManageFormPageLayout>
  );
}
