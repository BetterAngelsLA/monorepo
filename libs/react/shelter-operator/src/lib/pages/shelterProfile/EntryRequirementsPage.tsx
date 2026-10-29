import { useParams } from 'react-router-dom';
import { ShelterEntryRequirements } from '../../components/ShelterProfile';

export function ShelterEntryRequirementsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterEntryRequirements shelterId={shelterId} />;
}
