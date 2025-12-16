import { useQuery } from '@apollo/client/react';
import { HmisNoteOrdering, HmisNoteType, Ordering } from '../../apollo';
import { HmisNotesDocument } from '../../screens/ClientHMIS/tabs/ClientInteractionsHmisView/__generated__/ClientInteractionsHmisView.generated';

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
  const { data, error, loading } = useQuery(HmisNotesDocument, {
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

  let interactions: HmisNoteType[] | undefined = undefined;

  if (data) {
    interactions =
      data.hmisNotes.results.filter((n) => Boolean(n.location?.point)) ?? [];
  }

  if (error) {
    console.error('useGetHmisClientInteractionsWithLocation:', error);
  }

  return { interactions, loading, error };
}
