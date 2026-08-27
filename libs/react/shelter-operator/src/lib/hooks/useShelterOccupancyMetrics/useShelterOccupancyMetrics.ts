import { useQuery } from '@apollo/client/react';
import { toDateString } from '@monorepo/shared/scalars';
import {
  ShelterOccupancyMetricsDocument,
  type ShelterOccupancyMetricsQuery,
  type ShelterOccupancyMetricsQueryVariables,
} from './__generated__/useShelterOccupancyMetrics.generated';

export type ShelterOccupancyMetrics =
  ShelterOccupancyMetricsQuery['shelterOccupancyMetrics'];

export type ReservationMetrics = ShelterOccupancyMetrics['reservationMetrics'];

export type DailyBedStatusMetrics =
  ShelterOccupancyMetrics['dailyBedStatus'][number];

export type DailyOccupancyMetrics =
  ShelterOccupancyMetrics['dailyOccupancy'][number];

type UseShelterOccupancyMetricsArgs = {
  shelterId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

export function useShelterOccupancyMetrics({
  shelterId,
  startDate,
  endDate,
}: UseShelterOccupancyMetricsArgs) {
  const startDateVar = startDate ? toDateString(startDate) : undefined;
  const endDateVar = endDate ? toDateString(endDate) : undefined;
  const skip = !shelterId || !startDateVar || !endDateVar;

  const { data, loading, error, refetch } = useQuery<
    ShelterOccupancyMetricsQuery,
    ShelterOccupancyMetricsQueryVariables
  >(ShelterOccupancyMetricsDocument, {
    variables: {
      shelterId: shelterId ?? '',
      startDate: startDateVar ?? '',
      endDate: endDateVar ?? '',
    },
    skip,
  });

  return {
    metrics: data?.shelterOccupancyMetrics,
    loading,
    error,
    refetch,
  };
}
