import { Link, useNavigate, useParams } from 'react-router-dom';
import { RoomForm } from '../../components/rooms/room-form/RoomForm';
import { mapRoomToFormData } from '../../components/rooms/room-form/utils/mapRoomToFormData';
import { useRoom } from '../../hooks/useRoom';
import { shelterManageRoomsRoute } from '../../routing';

export function EditRoomPage() {
  const navigate = useNavigate();
  const { shelterId, roomId } = useParams();
  const shelterIdValue = shelterId ?? '';
  const roomIdValue = roomId ?? '';

  const { room, loading, error } = useRoom(roomIdValue);

  if (!shelterIdValue || !roomIdValue) return null;

  const roomsPath = shelterManageRoomsRoute(shelterIdValue);

  if (loading) {
    return (
      <div className="p-8 text-sm text-gray-600" role="status">
        Loading room…
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="space-y-4 p-8">
        <Link
          to={roomsPath}
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to Rooms
        </Link>
        <p className="text-sm text-red-600" role="alert">
          {error ? 'Unable to load this room.' : 'Room not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Link
        to={roomsPath}
        className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Back to Rooms
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Edit Room</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update room details for this shelter.
        </p>
      </div>

      <RoomForm
        key={room.id}
        shelterId={shelterIdValue}
        roomId={room.id}
        initialData={mapRoomToFormData(room)}
        onSuccess={() => navigate(roomsPath)}
        onCancel={() => navigate(roomsPath)}
      />
    </div>
  );
}
