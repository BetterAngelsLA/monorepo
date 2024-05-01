import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { NotesQuery, useNotesQuery } from '../../apollo';
import { MainContainer, NoteCard } from '../../ui-components';
import InteractionsHeader from './InteractionsHeader';
import InteractionsSorting from './InteractionsSorting';

const paginationLimit = 10;

export default function Interactions() {
  const [search, setSearch] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { data, loading, error, refetch } = useNotesQuery({
    variables: { pagination: { limit: paginationLimit + 1, offset: offset } },
  });
  const [notes, setNotes] = useState<NotesQuery['notes']>([]);
  const [sort, setSort] = useState<'list' | 'location' | 'sort'>('list');
  const [refreshing, setRefreshing] = useState(false);

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
      if (isMoreAvailable) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (!data || !('notes' in data)) return;

    const isMoreAvailable = data.notes.length > paginationLimit;
    const notesToShow = isMoreAvailable
      ? data.notes.slice(0, paginationLimit)
      : data.notes;

    if (offset === 0) {
      setNotes(notesToShow);
    } else {
      setNotes((prevNotes) => [...prevNotes, ...notesToShow]);
    }

    // TODO: @mikefeldberg - this is a temporary solution until backend provides a way to know if there are more notes
    setHasMore(isMoreAvailable);
  }, [data]);

  if (loading) return <TextRegular>Loading</TextRegular>;

  if (error) throw new Error('Something went wrong!');

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <InteractionsHeader search={search} setSearch={setSearch} />
      <InteractionsSorting sort={sort} setSort={setSort} notes={notes} />
      <FlatList
        refreshing={refreshing}
        onRefresh={onRefresh}
        ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} />}
        keyExtractor={(item) => item.id}
        ListFooterComponent={() =>
          hasMore && (
            <Button
              mt="lg"
              title="Load More"
              onPress={() => setOffset(offset + paginationLimit)}
              size="auto"
              variant="secondary"
              accessibilityHint={`loads more notes from the server`}
            />
          )
        }
      />
    </MainContainer>
  );
}
