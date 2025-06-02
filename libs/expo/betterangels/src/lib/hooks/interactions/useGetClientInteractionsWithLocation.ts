import { NoteOrder, NotesQuery, Ordering, useNotesQuery } from '../../apollo';

type TInteraction = NonNullable<
  NonNullable<NotesQuery['notes']>['results']
>[number];

const defaultSortOrder: NoteOrder = {
  interactedAt: Ordering.Desc,
  id: Ordering.Desc,
};

type TProps = {
  id: string;
  idSort?: Ordering;
  dateSort?: Ordering;
};

export function useGetClientInteractionsWithLocation(props: TProps) {
  const { id, idSort, dateSort } = props;

  const sortOrder = { ...defaultSortOrder, id: idSort, interactedAt: dateSort };

  const { data, error, loading } = useNotesQuery({
    variables: {
      pagination: { limit: 1000, offset: 0 },
      order: sortOrder,
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
