import { toPointFeature } from '@monorepo/expo/shared/ui-components';
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

    return interactions.map((i) =>
      toPointFeature({
        id: String(i.id),
        latitude: i.location!.point[1],
        longitude: i.location!.point[0],
        interactedAt: new Date(i.interactedAt),
      })
    );
  }, [interactions]);

  return { pointFeatures, loading, error, interactions };
}
