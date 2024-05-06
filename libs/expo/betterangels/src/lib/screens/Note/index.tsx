import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  DeleteModal,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useMutation } from '@apollo/client';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ViewNoteQuery, useViewNoteQuery } from '../../apollo';
import { DELETE_NOTE } from '../../apollo/graphql/mutations';
import { MainScrollContainer } from '../../ui-components';
import NoteLocation from './NoteLocation';
import NoteNextSteps from './NoteNextSteps';
import NotePublicNote from './NotePublicNote';
import NotePurpose from './NotePurpose';
import NoteServices from './NoteServices';
import NoteTitle from './NoteTitle';

const hasServicesOrMoods = (note: ViewNoteQuery['note']) => {
  return (
    note?.providedServices?.length > 0 ||
    note?.moods?.length > 0 ||
    note?.requestedServices?.length > 0
  );
};

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

  const [deleteNote] = useMutation(DELETE_NOTE);

  async function deleteNoteFunction() {
    try {
      await deleteNote({
        variables: {
          data: { id },
        },
        update: (cache) => {
          const cacheId = cache.identify({ __typename: 'NoteType', id: id });
          if (cacheId) {
            cache.evict({ id: cacheId });
            cache.gc();
          }
        },
      });
      router.back();
    } catch (err) {
      console.error(err);
      alert('Failed to delete the note. Please try again later.');
    }
  }

  if (loading) return <TextRegular>Loading</TextRegular>;

  if (error) throw new Error('Something went wrong. Please try again.');

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <NoteTitle note={data?.note} />
        {data?.note.point && <NoteLocation note={data?.note} />}
        {data?.note.purposes && data?.note.purposes.length > 0 && (
          <NotePurpose note={data?.note} />
        )}
        {data?.note && hasServicesOrMoods(data.note) && (
          <NoteServices note={data?.note} />
        )}
        {data?.note.nextSteps && data?.note.nextSteps.length > 0 && (
          <NoteNextSteps note={data?.note} />
        )}
        {data?.note.publicDetails && <NotePublicNote note={data?.note} />}
        <DeleteModal
          title="Confirm Delete"
          body="Are you sure you want to delete this note?"
          onDelete={deleteNoteFunction}
        />
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
