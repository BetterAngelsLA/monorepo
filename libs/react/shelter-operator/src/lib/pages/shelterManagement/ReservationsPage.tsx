import { useParams } from 'react-router';
import { Reservations } from '../../components/ShelterManagement';

export function ReservationsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <Reservations shelterId={shelterId} />;
}
