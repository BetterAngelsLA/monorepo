import { useQuery } from '@apollo/client/react';
import { HmisNoteOrdering, Ordering } from '../../apollo';
import {
  InteractionListHmisDocument,
  InteractionListHmisQuery,
} from '../../ui-components/InteractionListHmis/__generated__/interactionListHmis.generated';

const defaultSortOrder: HmisNoteOrdering = {
  date: Ordering.Desc,
  id: Ordering.Desc,
};

type TProps = {
  id: string;
  ordering?: Array<HmisNoteOrdering>;
};

export function useGetHmisClientInteractionsWithLocation(props: TProps) {
  const { id, ordering } = props;
  const { data, error, loading } = useQuery(InteractionListHmisDocument, {
    variables: {
      pagination: { limit: 1000, offset: 0 },
      ordering: ordering || defaultSortOrder,
      filters: {
        hmisClientProfile: id,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  let interactions:
    | InteractionListHmisQuery['hmisNotes']['results']
    | undefined = undefined;

  if (data) {
    interactions =
      data.hmisNotes.results.filter((n) => Boolean(n.location?.point)) ?? [];
  }

  if (error) {
    console.error('useGetHmisClientInteractionsWithLocation:', error);
  }

  return { interactions, loading, error };
}
