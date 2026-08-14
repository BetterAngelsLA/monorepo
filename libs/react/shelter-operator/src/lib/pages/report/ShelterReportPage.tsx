import { useQuery } from '@apollo/client/react';
import { Download } from 'lucide-react';
import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { Text } from '../../components/base-ui/text/text';
import { GetShelterOperatorOverviewDocument } from '../../components/overview/__generated__/overview.generated';
import { ShelterReportPrint } from './ShelterReportPrint';
import { useExportPdf } from './useExportPdf';

export function ShelterReportPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const targetRef = useRef<HTMLDivElement>(null);
  const { exportPdf, isExporting } = useExportPdf(
    targetRef,
    `shelter-report-${shelterId ?? 'unknown'}.pdf`
  );

  const { data, loading, error } = useQuery(GetShelterOperatorOverviewDocument, {
    variables: { shelterId: shelterId ?? '' },
    skip: !shelterId,
  });

  const report = data?.operatorShelter;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-end">
        <Button
          variant="primary"
          color="blue"
          leftIcon={<Download size={20} />}
          onClick={exportPdf}
          disabled={isExporting || !report}
        >
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </Button>
      </div>

      {loading && (
        <Text variant="body" textColor="text-[#6B7280]">
          Loading report…
        </Text>
      )}

      {error && (
        <Text variant="body" textColor="text-red-500">
          Failed to load the shelter report.
        </Text>
      )}

      {!loading && !error && !report && (
        <Text variant="body" textColor="text-[#6B7280]">
          No shelter data available for this report.
        </Text>
      )}

      {report && <ShelterReportPrint ref={targetRef} data={report} />}
    </div>
  );
}
