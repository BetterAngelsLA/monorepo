import { NotesQuery, Ordering, useNotesQuery } from '../../apollo';

type TInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];

export function useGetClientInteractionsWithLocation(id: string) {
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

  let interactions: TInteraction[] | undefined = undefined;

  if (data) {
    interactions =
      data.notes.results.filter((n) => Boolean(n.location?.point)) ?? [];
  }

  if (error) {
    console.error('useGetClientInteractionsWithLocation:', error);
  }

  return { interactions, loading, error };
}
