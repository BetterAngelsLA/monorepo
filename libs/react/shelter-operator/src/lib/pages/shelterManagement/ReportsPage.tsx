import { FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { ReportsView } from '../../components/reports/ReportsView';
import { shelterReportRoute } from '../../routing';

export function ReportsPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const navigate = useNavigate();

  if (!shelterId) {
    throw new Error('Something went wrong. Please try again.');
  }

  return (
    <>
      <div className="flex justify-end px-6 pt-6">
        <Button
          variant="primary"
          color="blue"
          leftIcon={<FileText size={20} />}
          onClick={() => navigate(shelterReportRoute(shelterId))}
        >
          Printable Report
        </Button>
      </div>

      <ReportsView shelterId={shelterId} />
    </>
  );
}
