import { useQuery } from '@apollo/client/react';
import { BedStatusChart, DailyOccupancyChart } from './ReportCharts';
import { ReportFilterBar } from './ReportFilterBar';
import { ReservationStatusChanges } from './ReservationStatusChanges';
import {
  GetShelterOccupancyMetricsDocument,
  type GetShelterOccupancyMetricsQuery,
  type GetShelterOccupancyMetricsQueryVariables,
} from './__generated__/reservationStatusChanges.generated';

/**
 * Reporting layout for a shelter's Reports tab. The filters and export are
 * still placeholders; the charts render the real BarChart (#2162) fed sample
 * data until the reporting query is wired up (data-wiring ticket).
 */
export function ReportsView({ shelterId }: { shelterId?: string }) {
  const { data } = useQuery<
    GetShelterOccupancyMetricsQuery,
    GetShelterOccupancyMetricsQueryVariables
  >(GetShelterOccupancyMetricsDocument, {
    variables: { shelterId: shelterId ?? '' },
    skip: !shelterId,
    fetchPolicy: 'cache-and-network',
  });
  const reservationMetrics = data?.shelterOccupancyMetrics.reservationMetrics;
  const avgDaysToOccupancy =
    data?.shelterOccupancyMetrics.avgDaysToOccupancy ?? null;

  return (
    <div className="mt-6 flex flex-col gap-6 px-6">
      <ReportFilterBar />

      {reservationMetrics && (
        <ReservationStatusChanges
          metrics={reservationMetrics}
          avgDaysToOccupancy={avgDaysToOccupancy}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <BedStatusChart />
        <DailyOccupancyChart />
      </div>
    </div>
  );
}
