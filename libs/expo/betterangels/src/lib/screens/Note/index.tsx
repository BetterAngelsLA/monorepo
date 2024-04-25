import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useViewNoteQuery } from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import NoteLocation from './NoteLocation';
import NoteNextSteps from './NoteNextSteps';
import NotePublicNote from './NotePublicNote';
import NotePurpose from './NotePurpose';
import NoteServices from './NoteServices';
import NoteTitle from './NoteTitle';

export default function Note({ id }: { id: string }) {
  const { data, loading, error } = useViewNoteQuery({ variables: { id } });
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TextButton
          color={Colors.WHITE}
          regular
          onPress={() => router.navigate(`/add-note/${id}`)}
          title="Edit"
          accessibilityHint="takes to edit the note"
        />
      ),
    });
  }, []);

  if (loading) return <BodyText>Loading</BodyText>;

  if (error || !id) throw new Error('Something went wrong. Please try again.');

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <NoteTitle note={data?.note} />
        <NoteLocation note={data?.note} />
        <NotePurpose note={data?.note} />
        <NoteServices note={data?.note} />
        <NoteNextSteps note={data?.note} />
        <NotePublicNote note={data?.note} />
      </View>
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    gap: Spacings.sm,
    borderRadius: 8,
    shadowColor: Colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
