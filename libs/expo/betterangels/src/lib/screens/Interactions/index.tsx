import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { NotesQuery, useNotesQuery } from '../../apollo';
import { MainContainer, NoteCard } from '../../ui-components';
import InteractionsHeader from './InteractionsHeader';
import InteractionsSorting from './InteractionsSorting';

export default function Interactions() {
  const [search, setSearch] = useState<string>('');
  const { data, loading, error } = useNotesQuery();
  const [notes, setNotes] = useState<NotesQuery['notes'] | undefined>();
  const [sort, setSort] = useState<'list' | 'location' | 'sort'>('list');

  useEffect(() => {
    if (!data || !('notes' in data)) return;

    setNotes(data.notes);
  }, [data]);

  if (loading) return <TextRegular>Loading</TextRegular>;

  if (error) throw new Error('Something went wrong!');

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <InteractionsHeader search={search} setSearch={setSearch} />
      <InteractionsSorting sort={sort} setSort={setSort} notes={notes} />
      <FlatList
        ItemSeparatorComponent={() => <View style={{ height: Spacings.xs }} />}
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} />}
        keyExtractor={(item) => item.id}
      />
    </MainContainer>
  );
}
