import { FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ReportsView } from '../../components/reports/ReportsView';
import { Button } from '../../components/base-ui/buttons/buttons';
import { shelterReportRoute } from '../../routing';

export function ReportsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <>
      <div className="flex justify-end px-6 pt-6">
        <Link to={shelterReportRoute(shelterId)}>
          <Button
            variant="primary"
            color="blue"
            leftIcon={<FileText size={20} />}
          >
            Printable Report
          </Button>
        </Link>
      </div>

      <ReportsView shelterId={shelterId} />
    </>
  );
}
