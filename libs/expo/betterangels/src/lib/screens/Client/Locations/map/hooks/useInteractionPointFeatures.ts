import { useMemo } from 'react';
import { PointFeature } from 'supercluster';
import { Ordering } from '../../../../../apollo';
import { useGetClientInteractionsWithLocation } from '../../../../../hooks';
import { TClusterInteraction } from '../types';

export function useInteractionPointFeatures(clientProfileId: string) {
  const { interactions, loading, error } = useGetClientInteractionsWithLocation(
    {
      id: clientProfileId,
      dateSort: Ordering.Desc,
    }
  );

  const pointFeatures = useMemo<PointFeature<TClusterInteraction>[]>(() => {
    if (!interactions) {
      return [];
    }

    return interactions.map((i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: i.location!.point },
      properties: {
        id: i.id,
        interactedAt: new Date(i.interactedAt),
      },
    }));
  }, [interactions]);

  return { pointFeatures, loading, error, interactions };
}
