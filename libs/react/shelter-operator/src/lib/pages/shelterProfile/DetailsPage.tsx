import { useParams } from 'react-router-dom';
import { Details } from '../../components/ShelterProfile';

export function DetailsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Details shelterId={shelterId} />;
}
