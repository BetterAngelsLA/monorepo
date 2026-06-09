import { Download } from 'lucide-react';
import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { ShelterReportPrint } from './ShelterReportPrint';
import { mockReport } from './mockReport';
import { useExportPdf } from './useExportPdf';

export function ShelterReportPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const targetRef = useRef<HTMLDivElement>(null);
  const { exportPdf, isExporting } = useExportPdf(
    targetRef,
    `shelter-report-${shelterId ?? 'unknown'}.pdf`
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-end">
        <Button
          variant="primary"
          color="blue"
          leftIcon={<Download size={20} />}
          onClick={exportPdf}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </Button>
      </div>

      <ShelterReportPrint ref={targetRef} data={mockReport} />
    </div>
  );
}
