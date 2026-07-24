import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { useShelterOccupancyMetrics } from '../../hooks/useShelterOccupancyMetrics';
import { dateRangeFilterAtom } from '../date-range-filter';
import { BedStatusChart, DailyOccupancyChart } from './ReportCharts';
import { ReportFilterBar } from './ReportFilterBar';
import { ReservationStatusChanges } from './ReservationStatusChanges';

/**
 * Reporting layout for a shelter's Reports tab.
 *
 * Fetches ShelterOccupancyMetrics for the current shelter + date-range filter
 * and logs the payload for verification until charts/stats are wired up.
 */
export function ReportsView({ shelterId }: { shelterId?: string }) {
  const { range } = useAtomValue(dateRangeFilterAtom);
  const { metrics, loading, error } = useShelterOccupancyMetrics({
    shelterId,
    startDate: range.from,
    endDate: range.to,
  });

  useEffect(() => {
    if (loading) {
      console.log('[reporting] loading shelter occupancy metrics…', {
        shelterId,
        startDate: range.from,
        endDate: range.to,
      });
      return;
    }
    if (error) {
      console.error('[reporting] failed to load shelter occupancy metrics', error);
      return;
    }
    if (metrics) {
      console.log('[reporting] shelter occupancy metrics', metrics);
    }
  }, [error, loading, metrics, range.from, range.to, shelterId]);

  return (
    <div className="mt-6 flex flex-col gap-6 px-6">
      <ReportFilterBar />

      <ReservationStatusChanges />

      <div className="grid gap-6 md:grid-cols-2">
        <BedStatusChart />
        <DailyOccupancyChart />
      </div>
    </div>
  );
}
