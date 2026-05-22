import { useParams } from 'react-router-dom';
import { BasicInfo } from '../../components/ShelterProfile.tsx';

export function BasicInfoPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <BasicInfo shelterId={shelterId} />;
}
