import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { uniqueBy } from 'remeda';
import { HmisClientNoteListType, HmisClientType } from '../../../../apollo';
import {
  MainScrollContainer,
  ProgramNoteCard,
} from '../../../../ui-components';
import { ListEmptyState } from './ListEmptyState';
import { ListLoadingView } from './ListLoadingView';
import { useHmisListClientNotesQuery } from './__generated__/ClientInteractionsHmisView.generated';

export const DEFAULT_PAGINATION_LIMIT = 20;

type TProgramNote = HmisClientNoteListType['items'][number];

type TProps = {
  client?: HmisClientType;
};

// TODO: Needs to be dynamic
const ENROLLMENT_ID = '517';

export function ClientInteractionsHmisView(props: TProps) {
  const { client } = props;

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [_totalCount, setTotalCount] = useState<number>(0);
  const [programNotes, setProgramNotes] = useState<TProgramNote[] | undefined>(
    undefined
  );

  const { data, loading } = useHmisListClientNotesQuery({
    variables: {
      enrollmentId: ENROLLMENT_ID,
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

  if (!client) {
    return null;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="create an interaction"
          accessibilityHint="create new interaction"
          onPress={() =>
            router.navigate(
              `/notes-hmis/create?hmisClientId=${client.personalId}`
            )
          }
        >
          <PlusIcon />
        </IconButton>
      </View>
      <FlashList<TProgramNote>
        data={programNotes}
        keyExtractor={(item) => item.id ?? ''}
        renderItem={({ item }) => (
          <ProgramNoteCard
            onPress={() => {
              router.navigate({
                pathname: `/notes-hmis/${item.id}/index`,
                params: {
                  personalId: client.personalId,
                  enrollmentId: item.enrollment?.enrollmentId,
                },
              });
            }}
            variant="clientProfile"
            note={item}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.05}
        ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
        extraData={programNotes?.length}
        ListEmptyComponent={<ListEmptyState />}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingBottom: 60,
          paddingHorizontal: Spacings.sm,
        }}
      />
    </MainScrollContainer>
  );
}
