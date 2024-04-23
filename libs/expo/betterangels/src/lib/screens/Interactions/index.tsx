import { useQuery } from '@apollo/client';
import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  BodyText,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import {
  GET_NOTES,
  NoteType,
  NotesQuery,
  NotesQueryVariables,
} from '../../apollo';
import { MainContainer, NoteCard } from '../../ui-components';

export default function Interactions() {
  const [search, setSearch] = useState<string>('');
  const { data, loading, error } = useQuery<NotesQuery, NotesQueryVariables>(
    GET_NOTES
  );
  const [notes, setNotes] = useState<Array<NoteType>>();

  function onDelete() {
    setSearch('');
  }

  useEffect(() => {
    if (!data) return;
    setNotes(data.notes);
  }, [data]);

  if (loading) return <BodyText>Loading</BodyText>;

  if (error) throw new Error('Something went wrong!');

  return (
    <MainContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacings.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <BasicInput
            placeholder="Search Clients"
            onDelete={onDelete}
            icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TextButton
          ml="sm"
          title="Filter"
          accessibilityHint={'opens interactions filter'}
        />
      </View>
      <FlatList
        data={notes}
        renderItem={({ item }) => <NoteCard note={item} />}
        keyExtractor={(item) => item.id}
      />
    </MainContainer>
  );
}
