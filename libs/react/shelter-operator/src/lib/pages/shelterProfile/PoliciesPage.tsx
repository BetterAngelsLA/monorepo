import { useParams } from 'react-router-dom';
import { ShelterPolicies } from '../../components/ShelterProfile/segments/Policies';

export function ShelterPoliciesPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ShelterPolicies shelterId={shelterId} />;
}
