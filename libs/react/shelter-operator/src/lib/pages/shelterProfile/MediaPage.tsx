import { useParams } from 'react-router-dom';
import { ShelterMedia } from '../../components/ShelterProfile';

export function ShelterMediaPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterMedia shelterId={shelterId} />;
}
