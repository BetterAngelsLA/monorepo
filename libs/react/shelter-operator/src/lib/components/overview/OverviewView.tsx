import { BedStatusChart, DailyOccupancyChart } from './ReportCharts';
import { ReportFilterBar } from './ReportFilterBar';
import { ReservationStatusChanges } from './ReservationStatusChanges';

/**
 * Reporting layout for a shelter's Overview tab. The filters and export are
 * still placeholders; the charts render the real BarChart (#2162) fed sample
 * data until the reporting query is wired up (data-wiring ticket).
 */
export function OverviewView({ shelterId: _shelterId }: { shelterId?: string }) {
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
