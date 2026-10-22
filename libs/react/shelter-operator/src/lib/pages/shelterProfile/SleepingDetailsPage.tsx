import { useParams } from 'react-router-dom';
import { ShelterSleepingDetails } from '../../components/ShelterProfile';

export function ShelterSleepingDetailsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterSleepingDetails shelterId={shelterId} />;
}
