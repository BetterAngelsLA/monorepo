import { useQuery } from '@apollo/client/react';
import { format } from 'date-fns';
import {
  ShelterOccupancyMetricsDocument,
  type ShelterOccupancyMetricsQuery,
  type ShelterOccupancyMetricsQueryVariables,
} from './__generated__/useShelterOccupancyMetrics.generated';

export type ShelterOccupancyMetrics =
  ShelterOccupancyMetricsQuery['shelterOccupancyMetrics'];

type UseShelterOccupancyMetricsArgs = {
  shelterId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

function toDateVariable(value: Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return format(value, 'yyyy-MM-dd');
}

export function useShelterOccupancyMetrics({
  shelterId,
  startDate,
  endDate,
}: UseShelterOccupancyMetricsArgs) {
  const startDateVar = toDateVariable(startDate);
  const endDateVar = toDateVariable(endDate);
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
