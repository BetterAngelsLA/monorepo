import { useEffect, useState } from 'react';
import { NotesQuery, Ordering, useNotesQuery } from '../../apollo';

type TInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];

export function useGetClientInteractionsWithLocation(id: string) {
  const [interactions, setInteractions] = useState<TInteraction[] | undefined>(
    undefined
  );

  const { data, error, loading } = useNotesQuery({
    variables: {
      pagination: { limit: 1000, offset: 0 },
      order: { interactedAt: Ordering.Desc, id: Ordering.Desc },
      filters: {
        clientProfile: id,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    try {
      const withLocation = data.notes.results.filter(
        (note) => !!note.location?.point
      );

      setInteractions(withLocation);
    } catch (e) {
      console.error(`useGetClientInteractionsWithLocation: ${e}`);

      setInteractions([]);
    }
  }, [data]);

  if (error) {
    console.error('useGetClientInteractionsWithLocation:', error);

    return {};
  }

  return { interactions, loading };
}
