import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { uniqueBy } from 'remeda';
import { HmisClientNoteListType, HmisClientType } from '../../../../apollo';
import { MainContainer, ProgramNoteCard } from '../../../../ui-components';
import { useListClientProgramNotesQuery } from './__generated__/ProgramNotes.generated';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';

export const DEFAULT_PAGINATION_LIMIT = 20;

interface IProgramNotesProps {
  client?: HmisClientType;
}

type TProgramNote = HmisClientNoteListType['items'][number];

export function ProgramNotes(props: IProgramNotesProps) {
  const { client } = props;
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [programNotes, setProgramNotes] = useState<TProgramNote[] | undefined>(
    undefined
  );

  const { data, loading } = useListClientProgramNotesQuery({
    variables: {
      // TODO: how do we get enrollmentId here?
      enrollmentId: client?.enrollmentId || '',
      personalId: client?.personalId || '',
      pagination: { page, perPage: DEFAULT_PAGINATION_LIMIT },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useEffect(() => {
    const res = data?.hmisListClientNotes;
    if (!res) return;

    if (res.__typename === 'HmisClientNoteListType') {
      const { items, meta } = res;

      setTotalCount(meta?.totalCount ?? 0);
      setHasMore((meta?.currentPage ?? 1) < (meta?.pageCount ?? 1));

      setProgramNotes((prev) => {
        if (page === 1 || !prev) return items;

        return uniqueBy([...prev, ...items], (c) => c.id ?? '');
      });
    }
  }, [data, page]);

  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  const renderFooter = () =>
    loading ? <ListLoadingView style={{ paddingVertical: 40 }} /> : null;

  if (programNotes === undefined && loading) {
    return <ListLoadingView fullScreen />;
  }

  if (!programNotes) return null;
  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <FlashList<TProgramNote>
        data={programNotes}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={({ item }) => (
          <ProgramNoteCard variant="clientProfile" note={item} />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.05}
        ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
        extraData={programNotes.length}
        ListEmptyComponent={<ListEmptyState />}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingBottom: 60,
          paddingHorizontal: Spacings.sm,
        }}
      />
    </MainContainer>
  );
}
