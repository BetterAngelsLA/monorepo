import { useAtomValue } from 'jotai';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { dateRangeFilterAtom } from '../date-range-filter';
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
  const { range } = useAtomValue(dateRangeFilterAtom);
  const { metrics, loading, error } = useShelterOccupancyMetrics({
    shelterId,
    startDate: range.from,
    endDate: range.to,
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
      <ReportFilterBar shelterId={shelterId} />

      <ReservationStatusChanges
        metrics={metrics?.reservationMetrics}
        avgDaysToOccupancy={metrics?.avgDaysToOccupancy}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <BedStatusChart data={metrics?.dailyBedStatus} />
        <DailyOccupancyChart data={metrics?.dailyOccupancy} />
      </div>
    </div>
  );
}
