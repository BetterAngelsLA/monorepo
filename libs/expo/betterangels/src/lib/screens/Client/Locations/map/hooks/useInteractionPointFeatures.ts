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
      ordering: [{ interactedAt: Ordering.Desc }, { id: Ordering.Desc }],
    }
  );

  const pointFeatures = useMemo<PointFeature<TClusterInteraction>[]>(() => {
    if (!interactions) {
      return [];
    }

    return interactions.map((i, index) =>
      toPointFeature({
        id: String(i.id),
        latitude: i.location!.point[1],
        longitude: i.location!.point[0],
        interactedAt: new Date(i.interactedAt),
        // mostRecent prop is dependent on interactions NotesQuery sort order
        mostRecent: index === 0,
      })
    );
  }, [interactions]);

  return { pointFeatures, loading, error, interactions };
}
