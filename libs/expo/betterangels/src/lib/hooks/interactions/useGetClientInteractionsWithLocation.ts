import {
  NoteOrder,
  Ordering,
  TNotesQueryInteraction,
  useNotesQuery,
} from '../../apollo';

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
  const sortOrderingArray = Object.entries(sortOrder).map(([key, value]) => ({
    [key]: value,
  }));

  const { data, error, loading } = useNotesQuery({
    variables: {
      pagination: { limit: 1000, offset: 0 },
      ordering: sortOrderingArray,
      filters: {
        clientProfile: id,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  let interactions: TNotesQueryInteraction[] | undefined = undefined;

  if (data) {
    interactions =
      data.notes.results.filter((n) => Boolean(n.location?.point)) ?? [];
  }

  if (error) {
    console.error('useGetClientInteractionsWithLocation:', error);
  }

  return { interactions, loading, error };
}
