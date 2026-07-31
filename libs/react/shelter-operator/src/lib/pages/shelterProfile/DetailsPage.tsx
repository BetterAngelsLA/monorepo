import { useParams } from 'react-router-dom';
import { ShelterDetails } from '../../components/ShelterProfile';

export function ShelterDetailsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterDetails shelterId={shelterId} />;
}
