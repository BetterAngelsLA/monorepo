import {
  BED_STATUS_LEGEND,
  ChartCardPlaceholder,
} from './ChartCardPlaceholder';
import { ReportFilterBar } from './ReportFilterBar';
import { ReservationStatusChanges } from './ReservationStatusChanges';

/**
 * Reporting layout for a shelter's Overview tab. This is the placeholder
 * version: the filters, export, stat boxes, and charts are labeled placeholders
 * whose contents will be replaced with the real implementations in later tickets.
 */
export function OverviewView({ shelterId: _shelterId }: { shelterId?: string }) {
  return (
    <div className="mt-6 flex flex-col gap-6 px-6">
      <ReportFilterBar />

      <ReservationStatusChanges />

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCardPlaceholder
          title="Bed Status"
          yAxisLabel="Status by %"
          legend={BED_STATUS_LEGEND}
          testId="bed-status-chart-placeholder"
        />
        <ChartCardPlaceholder
          title="Daily Occupancy"
          yAxisLabel="Occupancy by %"
          testId="daily-occupancy-chart-placeholder"
        />
      </div>
    </div>
  );
}
