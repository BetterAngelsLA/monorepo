import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { NotesPaginatedQuery, Ordering, useNotesPaginatedQuery } from '../../../apollo';
import { MainContainer, NoteCard } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import InteractionsHeader from './InteractionsHeader';
import InteractionsSorting from './InteractionsSorting';

const paginationLimit = 10;

export default function Interactions({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [notes, setNotes] = useState<NotesPaginatedQuery['notesPaginated']['results']>([]);
  const [sort, setSort] = useState<'list' | 'location' | 'sort'>('list');
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refetch, fetchMore } = useNotesPaginatedQuery({
    variables: {
      pagination: { limit: paginationLimit, offset: 0 },
      order: { interactedAt: Ordering.Desc, id: Ordering.Desc },
      filters: { client: client?.clientProfile.user.id, search: filterSearch },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const loadMoreInteractions = useCallback(async () => {
    if (hasMore && !loading && data?.notesPaginated?.pageInfo) {
      const { offset, limit } = data.notesPaginated.pageInfo;

      if (offset === undefined || offset === null || limit === undefined || limit === null) {
        return;
      }

      const nextOffset = offset + limit;

      if (nextOffset < data.notesPaginated.totalCount) {
        try {
          const fetchMoreResult = await fetchMore({
            variables: {
              pagination: { limit: paginationLimit, offset: nextOffset },
            },
          });

          const newNotes = fetchMoreResult.data?.notesPaginated?.results || [];
          setNotes((prevNotes) => [...prevNotes, ...newNotes]);

          const newPageInfo = fetchMoreResult.data.notesPaginated.pageInfo;

          if (newPageInfo.offset === null || newPageInfo.offset === undefined ||
              newPageInfo.limit === null || newPageInfo.limit === undefined) {
            setHasMore(false);
            return;
          }

          setHasMore(newPageInfo.offset + newPageInfo.limit < fetchMoreResult.data.notesPaginated.totalCount);
        } catch (err) {
          console.error('Error loading more notes:', err);
        }
      } else {
        setHasMore(false);
      }
    }
  }, [hasMore, loading, data, fetchMore]);

  const debounceFetch = useMemo(
    () =>
      debounce((text) => {
        setFilterSearch(text);
      }, 500),
    []
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await refetch({
        pagination: { limit: paginationLimit, offset: 0 },
      });
      const newNotes = response.data?.notesPaginated?.results || [];
      setNotes(newNotes);

      const { offset, limit } = response.data?.notesPaginated?.pageInfo;
      const totalCount = response.data?.notesPaginated?.totalCount;

      if (offset === null || offset === undefined ||
        limit === null || limit === undefined ||
        totalCount === null || totalCount === undefined) {
      setHasMore(false);
      return;
      }
      
      setHasMore(offset + limit < totalCount);
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  const onChange = (e: string) => {
    setSearch(e);
    debounceFetch(e);
  };

  useEffect(() => {
    if (!data || !('notesPaginated' in data)) return;

    const initialNotes = data.notesPaginated.results;
    setNotes(initialNotes);

    const { offset, limit } = data.notesPaginated.pageInfo;
    const totalCount = data.notesPaginated.totalCount;

    if (offset === null || offset === undefined ||
      limit === null || limit === undefined ||
      totalCount === null || totalCount === undefined) {
    setHasMore(false);
    return;
    }

    setHasMore(offset + limit < totalCount);
  }, [data]);

  if (error) throw new Error('Something went wrong!');

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <FlatList
        ListHeaderComponent={
          <>
            <InteractionsHeader search={search} setSearch={onChange} />
            <InteractionsSorting
              sort={sort}
              setSort={setSort}
              notes={notes}
              client={client}
            />
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.PRIMARY}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
        data={notes}
        renderItem={({ item: note }) => <NoteCard note={note} />}
        keyExtractor={(note) => note.id}
        ListFooterComponent={() =>
          loading ? (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Loading size="large" color={Colors.NEUTRAL_DARK} />
            </View>
          ) : null
        }
        onEndReached={loadMoreInteractions}
        onEndReachedThreshold={0.5}
      />
    </MainContainer>
  );
}
