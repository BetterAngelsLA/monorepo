import { useParams } from 'react-router-dom';
import { Occupants } from '../../components/ShelterManagement';

export function OccupantsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Occupants shelterId={shelterId} />;
}
