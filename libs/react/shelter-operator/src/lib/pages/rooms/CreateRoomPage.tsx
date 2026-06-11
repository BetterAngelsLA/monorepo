import { Link, useNavigate, useParams } from 'react-router-dom';
import { RoomForm } from '../../components/rooms/room-form/RoomForm';
import { shelterManageRoomsRoute } from '../../routing';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { shelterId } = useParams();
  const id = shelterId ?? '';

  if (!id) return null;

  const roomsPath = shelterManageRoomsRoute(id);

  return (
    <div className="space-y-6 p-8">
      <Link
        to={roomsPath}
        className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Back to Rooms
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Create Room</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new room to this shelter. Fields left blank will use defaults
          where applicable.
        </p>
      </div>

      <RoomForm
        shelterId={id}
        onSuccess={() => navigate(roomsPath)}
        onCancel={() => navigate(roomsPath)}
      />
    </div>
  );
}
