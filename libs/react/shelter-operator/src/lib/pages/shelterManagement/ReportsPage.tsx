import { useParams } from 'react-router';
import { ReportsView } from '../../components/reports/ReportsView';

export function ReportsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <ReportsView shelterId={shelterId} />;
}
