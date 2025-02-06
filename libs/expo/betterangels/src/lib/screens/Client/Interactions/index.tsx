import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Loading } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import {
  NotesPaginatedQuery,
  Ordering,
  useNotesPaginatedQuery,
} from '../../../apollo';
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
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const { data, loading, error, refetch } = useNotesPaginatedQuery({
    variables: {
      pagination: { limit: paginationLimit, offset: offset },
      order: { interactedAt: Ordering.Desc, id: Ordering.Desc },
      filters: { client: client?.clientProfile.user.id, search: filterSearch },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [notes, setNotes] = useState<
    NotesPaginatedQuery['notesPaginated']['results']
  >([]);
  const [sort, setSort] = useState<'list' | 'location' | 'sort'>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  function loadMoreInteractions() {
    if (hasMore && !loading) {
      setOffset((prevOffset) => prevOffset + paginationLimit);
    }
  }

  const debounceFetch = useMemo(
    () =>
      debounce((text) => {
        setFilterSearch(text);
      }, 500),
    []
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    try {
      const response = await refetch({
        pagination: { limit: paginationLimit + 1, offset: 0 },
      });
      if (response.data && 'notesPaginated' in response.data) {
        const { totalCount } = response.data.notesPaginated;
        setTotalCount(totalCount);
        setHasMore(paginationLimit < totalCount);
      }
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
    if (!data || !('notesPaginated' in data)) {
      return;
    }

    const { results, totalCount } = data.notesPaginated;
    setTotalCount(totalCount);

    if (offset === 0) {
      setNotes(results);
    } else {
      setNotes((prevNotes) => [...prevNotes, ...results]);
    }

    setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

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
              totalCount={totalCount}
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
