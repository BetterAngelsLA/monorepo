import { FileSearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Loading,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import {
  NotesQuery,
  Ordering,
  SelahTeamEnum,
  useNotesQuery,
} from '../../apollo';
import useUser from '../../hooks/user/useUser';
import { MainContainer, NoteCard } from '../../ui-components';
import InteractionsFilters from './InteractionsFilters/TeamsFilter';
import InteractionsHeader from './InteractionsHeader';
import InteractionsSorting from './InteractionsSorting';

const paginationLimit = 10;

type TFilters = {
  teams: { id: SelahTeamEnum; label: string }[];
};

export default function Interactions() {
  const [search, setSearch] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filters, setFilters] = useState<TFilters>({
    teams: [],
  });
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { user } = useUser();

  const { data, loading, error, refetch } = useNotesQuery({
    variables: {
      pagination: { limit: paginationLimit + 1, offset: offset },
      order: { interactedAt: Ordering.Desc, id: Ordering.Desc },
      filters: {
        createdBy: user?.id,
        search: filterSearch,
        teams: filters.teams.length
          ? filters.teams.map((item) => item.id)
          : null,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  const [notes, setNotes] = useState<NotesQuery['notes']>([]);
  const [sort, setSort] = useState<'list' | 'location' | 'sort'>('list');
  const [refreshing, setRefreshing] = useState(false);

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

  const onFiltersReset = () => {
    setFilters({ teams: [] });
  };

  const onChange = (e: string) => {
    setSearch(e);

    debounceFetch(e);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    try {
      const response = await refetch({
        pagination: { limit: paginationLimit + 1, offset: 0 },
      });
      const isMoreAvailable =
        response.data &&
        'notes' in response.data &&
        response.data.notes.length > paginationLimit;
      setHasMore(isMoreAvailable);
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (!data || !('notes' in data)) return;

    const notesToShow = data.notes.slice(0, paginationLimit);
    const isMoreAvailable = data.notes.length > notesToShow.length;

    if (offset === 0) {
      setNotes(notesToShow);
    } else {
      setNotes((prevNotes) => [...prevNotes, ...notesToShow]);
    }

    // TODO: @mikefeldberg - this is a temporary solution until backend provides a way to know if there are more notes
    setHasMore(isMoreAvailable);
  }, [data, offset]);

  const updateFilters = (newFilters: TFilters) => {
    setFilters(newFilters);
    setOffset(0);
  };

  if (error) throw new Error('Something went wrong!');

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <InteractionsHeader
        onFiltersReset={onFiltersReset}
        search={search}
        setSearch={onChange}
      />
      <InteractionsFilters filters={filters} setFilters={updateFilters} />
      <InteractionsSorting sort={sort} setSort={setSort} notes={notes} />
      {search && !loading && notes.length < 1 && (
        <View
          style={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              height: 90,
              width: 90,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: Radiuses.xxxl,
              backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
              marginBottom: Spacings.md,
            }}
          >
            <FileSearchIcon size="2xl" />
          </View>
          <TextBold mb="xs" size="sm">
            No Results
          </TextBold>
          <TextRegular size="sm">Try searching for something else.</TextRegular>
        </View>
      )}
      <FlatList
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
