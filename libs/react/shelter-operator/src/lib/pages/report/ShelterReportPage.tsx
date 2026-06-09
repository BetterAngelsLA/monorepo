import { Download } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePDF } from 'react-to-pdf';
import { Button } from '../../components/base-ui/buttons/buttons';
import { ShelterReportPrint } from './ShelterReportPrint';
import { mockReport } from './mockReport';

/**
 * Route wrapper for the shelter PDF report.
 *
 * Spike scope: renders mock data and proves the client-side react-to-pdf
 * export works end-to-end. Real `useQuery` wiring (mirroring
 * `GetAdminShelterOverview`) comes later.
 */
export function ShelterReportPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const [isExporting, setIsExporting] = useState(false);

  const { toPDF, targetRef } = usePDF({
    filename: `shelter-report-${shelterId ?? 'unknown'}.pdf`,
    page: { format: 'letter', orientation: 'portrait', margin: 10 },
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      await toPDF();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="mx-auto mb-4 flex max-w-[800px] justify-end">
        <Button
          variant="primary"
          color="blue"
          leftIcon={<Download size={20} />}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </Button>
      </div>

      {/* targetRef marks the DOM captured into the PDF; the button above is
          intentionally outside it so it isn't included in the output. */}
      <ShelterReportPrint ref={targetRef} data={mockReport} />
    </div>
  );
}

export default ShelterReportPage;
