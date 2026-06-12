import { useParams } from 'react-router-dom';
import { ShelterSchedules } from '../../components/ShelterProfile';

export function ShelterOperatingHoursPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterSchedules shelterId={shelterId} />;
}
