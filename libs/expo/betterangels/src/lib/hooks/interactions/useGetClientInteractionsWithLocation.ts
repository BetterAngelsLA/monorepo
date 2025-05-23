import { useEffect, useState } from 'react';
import { NotesQuery, Ordering, useNotesQuery } from '../../apollo';

type TInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];

export function useGetClientInteractionsWithLocation(id: string) {
  const [interactions, setInteractions] = useState<TInteraction[]>();

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
    const results = data?.notes.results;

    if (!data || !('notes' in data) || !results?.length) {
      setInteractions([]);

      return;
    }

    const withLocation = results.filter((note) => !!note.location?.point);

    setInteractions(withLocation);
  }, [data]);

  if (error) {
    console.error('Error fetching interactions:', error);

    return {};
  }

  return { interactions, loading };
}
