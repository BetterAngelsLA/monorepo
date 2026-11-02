import { useParams } from 'react-router';
import { ShelterServices } from '../../components/ShelterProfile';

export function ShelterServicesPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterServices shelterId={shelterId} />;
}
