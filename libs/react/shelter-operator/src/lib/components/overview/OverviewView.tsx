import {
  BED_STATUS_LEGEND,
  ChartCardPlaceholder,
  ReportFilterBar,
  ReservationStatusChanges,
} from './reports';

/**
 * Reporting layout for a shelter's Overview tab. This is the placeholder
 * version: the filters, export, stat boxes, and charts are labeled placeholders
 * whose contents will be replaced with the real implementations in later tickets.
 */
export function OverviewView() {
  return (
    <div className="mt-6 flex flex-col gap-6 px-6">
      <ReportFilterBar />

      <ReservationStatusChanges />

      <div className="grid gap-4 md:grid-cols-2">
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
