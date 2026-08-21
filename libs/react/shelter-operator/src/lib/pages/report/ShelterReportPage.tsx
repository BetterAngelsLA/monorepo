import { useQuery } from '@apollo/client/react';
import { useAtomValue } from 'jotai';
import { Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/base-ui/buttons/buttons';
import { Text } from '../../components/base-ui/text/text';
import { dateRangeFilterAtom } from '../../components/date-range-filter';
import { GetShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import type { ExportMetric } from './ShelterReportPrint';
import { ShelterReportPrint } from './ShelterReportPrint';
import { useExportPdf } from './useExportPdf';

const ALL_METRICS: ExportMetric[] = [
  'average-days-to-occupancy',
  'reservation-status-changes',
  'bed-status',
  'daily-occupancy',
];

export function ShelterReportPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const { range } = useAtomValue(dateRangeFilterAtom);
  const [generatedAt] = useState(() => new Date());

  const targetRef = useRef<HTMLDivElement>(null);
  const { exportPdf, isExporting } = useExportPdf(targetRef);

  const { data: shelterData, loading: shelterLoading } = useQuery(
    GetShelterSummaryDocument,
    { variables: { id: shelterId ?? '' }, skip: !shelterId },
  );
  const {
    metrics,
    loading: metricsLoading,
    error,
  } = useShelterOccupancyMetrics({
    shelterId,
    startDate: range.from,
    endDate: range.to,
  });

  const loading = shelterLoading || metricsLoading;
  const hasRange = !!range.from && !!range.to;
  const ready = !loading && !error && hasRange;

  async function handleExport() {
    if (!shelterId) return;
    const filename = `shelter-${shelterId}-report.pdf`;
    const { blob } = await exportPdf(filename);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-end">
        <Button
          variant="primary"
          color="blue"
          leftIcon={<Download size={20} />}
          onClick={handleExport}
          disabled={isExporting || !ready}
        >
          {isExporting ? 'Exporting…' : 'Export PDF'}
        </Button>
      </div>

      {loading && (
        <Text variant="body" textColor="text-[#6B7280]">
          Loading report…
        </Text>
      )}

      {!loading && error && (
        <Text variant="body" textColor="text-red-500">
          Failed to load the shelter report.
        </Text>
      )}

      {!loading && !error && !hasRange && (
        <Text variant="body" textColor="text-[#6B7280]">
          Select a date range to generate a report.
        </Text>
      )}

      {ready && (
        <ShelterReportPrint
          ref={targetRef}
          shelterName={shelterData?.operatorShelter?.name}
          shelterAddress={
            shelterData?.operatorShelter?.location?.place ?? undefined
          }
          range={{ from: range.from as Date, to: range.to as Date }}
          generatedAt={generatedAt}
          includedMetrics={ALL_METRICS}
          metrics={metrics?.reservationMetrics}
          avgDaysToOccupancy={metrics?.avgDaysToOccupancy}
          dailyBedStatus={metrics?.dailyBedStatus}
          dailyOccupancy={metrics?.dailyOccupancy}
        />
      )}
    </div>
  );
}
