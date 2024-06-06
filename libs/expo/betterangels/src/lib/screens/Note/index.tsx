import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  DeleteModal,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ViewNoteQuery,
  useDeleteNoteMutation,
  useViewNoteQuery,
} from '../../apollo';
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
  const { data, loading, error } = useViewNoteQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

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

  const [deleteNote, { error: deleteError }] = useDeleteNoteMutation();

  async function deleteNoteFunction() {
    try {
      const result = await deleteNote({
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

      if (!result.data)
        throw new Error(`Error uploading image: ${deleteError}`);

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
        {data?.note.location?.point && <NoteLocation note={data?.note} />}
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
      </View>
      <DeleteModal
        body="All data associated with this note will be deleted"
        title="Delete note?"
        onDelete={deleteNoteFunction}
        button={
          <Button
            accessibilityHint="deletes creation"
            title="Delete Note"
            variant="negative"
            size="full"
            mt="sm"
          />
        }
      />
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    marginBottom: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.md,
    gap: Spacings.sm,
    borderRadius: 8,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
  },
});
