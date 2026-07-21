import { useParams } from 'react-router-dom';
import { Rooms } from '../../components/ShelterManagement/segments/Rooms';

export function RoomsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Rooms shelterId={shelterId} />;
}
