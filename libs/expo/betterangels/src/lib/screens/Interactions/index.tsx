import { useQuery } from '@apollo/client';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import {
  GET_NOTES,
  NoteType,
  NotesQuery,
  NotesQueryVariables,
} from '../../apollo';
import { MainContainer, NoteCard } from '../../ui-components';
import InteractionsHeader from './InteractionsHeader';
import InteractionsSorting from './InteractionsSorting';

export default function Interactions() {
  const [search, setSearch] = useState<string>('');
  const { data, loading, error } = useQuery<NotesQuery, NotesQueryVariables>(
    GET_NOTES
  );
  const [notes, setNotes] = useState<Array<NoteType>>();
  const [sort, setSort] = useState<'list' | 'location' | 'sort'>('list');

  useEffect(() => {
    if (!data) return;
    setNotes(data.notes);
  }, [data]);

  if (loading) return <BodyText>Loading</BodyText>;

  if (error) throw new Error('Something went wrong!');

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <InteractionsHeader search={search} setSearch={setSearch} />
      <InteractionsSorting sort={sort} setSort={setSort} notes={notes} />
      <FlatList
        style={{ gap: Spacings.xs }}
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} />}
        keyExtractor={(item) => item.id}
      />
    </MainContainer>
  );
}
