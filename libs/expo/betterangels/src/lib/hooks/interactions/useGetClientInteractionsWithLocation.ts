import { useQuery } from '@apollo/client/react';
import {
  NoteOrder,
  NotesDocument,
  Ordering,
  TNotesQueryInteraction,
} from '../../apollo';

const defaultSortOrder: NoteOrder = {
  interactedAt: Ordering.Desc,
  id: Ordering.Desc,
};

type TProps = {
  id: string;
  ordering?: Array<NoteOrder>;
};

export function useGetClientInteractionsWithLocation(props: TProps) {
  const { id, ordering } = props;
  const { data, error, loading } = useQuery(NotesDocument, {
    variables: {
      pagination: { limit: 1000, offset: 0 },
      ordering: ordering || defaultSortOrder,
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
