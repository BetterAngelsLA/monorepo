import { useQuery } from '@apollo/client/react';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { GetShelterSummaryDocument } from '../../graphql/__generated__/shelters.generated';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { dateRangeFilterAtom } from '../date-range-filter';
import { ExportShelterModal, type IExportResult } from './ExportShelterModal';
import { ExportStatusNotification } from './ExportStatusNotification';
import { BedStatusChart, DailyOccupancyChart } from './ReportCharts';
import { ReportFilterBar } from './ReportFilterBar';
import { ReservationStatusChanges } from './ReservationStatusChanges';

/**
 * Reporting layout for a shelter's Reports tab.
 *
 * Fetches ShelterOccupancyMetrics for the current shelter + date-range filter
 * and passes the metrics into the reservation status summary cards and charts.
 */
export function ReportsView({ shelterId }: { shelterId?: string }) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<IExportResult | null>(null);

  const { range } = useAtomValue(dateRangeFilterAtom);
  const { metrics, loading, error } = useShelterOccupancyMetrics({
    shelterId,
    startDate: range.from,
    endDate: range.to,
  });

  const { data: shelterData } = useQuery(GetShelterSummaryDocument, {
    variables: { id: shelterId ?? '' },
    skip: !shelterId,
  });

  if (loading) {
    console.log('[reporting] loading shelter occupancy metrics…', {
      shelterId,
      startDate: range.from,
      endDate: range.to,
    });
  } else if (error) {
    console.error(
      '[reporting] failed to load shelter occupancy metrics',
      error,
    );
  } else if (metrics) {
    console.log('[reporting] shelter occupancy metrics', metrics);
  }

  return (
    <div className="mt-6 flex flex-col gap-6 px-6 pb-10">
      <ReportFilterBar
        exportDisabled={!shelterId}
        onExportClick={() => setIsExportModalOpen(true)}
      />

      <ReservationStatusChanges
        metrics={metrics?.reservationMetrics}
        avgDaysToOccupancy={metrics?.avgDaysToOccupancy}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <BedStatusChart data={metrics?.dailyBedStatus} />
        <DailyOccupancyChart data={metrics?.dailyOccupancy} />
      </div>

      <ExportShelterModal
        isOpen={isExportModalOpen}
        shelterId={shelterId}
        shelterName={shelterData?.operatorShelter?.name}
        shelterAddress={
          shelterData?.operatorShelter?.location?.place ?? undefined
        }
        onClose={() => setIsExportModalOpen(false)}
        onExport={(result) => {
          setIsExportModalOpen(false);
          setExportResult(result);
        }}
      />

      {exportResult && (
        <div className="fixed right-6 top-6 z-50 flex flex-col gap-4">
          <ExportStatusNotification
            success={exportResult.success}
            description={exportResult.description}
            onClose={() => setExportResult(null)}
          />
        </div>
      )}
    </div>
  );
}
