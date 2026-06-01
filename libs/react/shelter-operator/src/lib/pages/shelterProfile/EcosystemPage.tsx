import { useParams } from 'react-router-dom';
import { ShelterEcosystem } from '../../components/ShelterProfile';

export function EcosystemPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterEcosystem shelterId={shelterId} />;
}
