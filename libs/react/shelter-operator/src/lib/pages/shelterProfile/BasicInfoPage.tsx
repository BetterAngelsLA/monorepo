import { useParams } from 'react-router';
import { ShelterBasicInfo } from '../../components/ShelterProfile';

export function ShelterBasicInfoPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterBasicInfo shelterId={shelterId} />;
}
