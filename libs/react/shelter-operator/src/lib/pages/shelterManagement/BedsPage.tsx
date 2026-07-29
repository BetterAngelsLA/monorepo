import { useParams } from 'react-router-dom';
import { Beds } from '../../components/ShelterManagement/segments/Beds';

export function BedsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Beds shelterId={shelterId} />;
}
