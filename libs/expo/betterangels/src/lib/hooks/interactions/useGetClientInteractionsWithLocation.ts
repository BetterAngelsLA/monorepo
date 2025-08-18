import {
  NoteOrder,
  Ordering,
  TNotesQueryInteraction,
  useNotesQuery,
} from '../../apollo';

const defaultSortOrder: Array<NoteOrder> = [
  { interactedAt: Ordering.Desc },
  { id: Ordering.Desc },
];

type TProps = {
  id: string;
  ordering?: Array<NoteOrder>;
};

export function useGetClientInteractionsWithLocation(props: TProps) {
  const { id, ordering } = props;
  const sortOrdering = ordering || defaultSortOrder;

  const { data, error, loading } = useNotesQuery({
    variables: {
      pagination: { limit: 1000, offset: 0 },
      ordering: sortOrdering,
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
