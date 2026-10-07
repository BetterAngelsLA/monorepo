import { useParams } from 'react-router-dom';
import { ShelterBaPrivate } from '../../components/ShelterProfile';

export function BaPrivatePage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterBaPrivate shelterId={shelterId} />;
}
