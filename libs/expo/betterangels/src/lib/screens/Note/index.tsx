import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Loading, TextButton } from '@monorepo/expo/shared/ui-components';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuery } from '@apollo/client/react';
import { MainScrollContainer } from '../../ui-components';
import NoteByline from './NoteByline';
import NoteClient from './NoteClient';
import NoteLocation from './NoteLocation';
import NotePublicNote from './NotePublicNote';
import NoteServices from './NoteServices';
import NoteTitle from './NoteTitle';
import { NoteSummaryDocument } from './__generated__/NoteSummary.generated';

export default function Note({
  id,
  arrivedFrom,
}: {
  id: string;
  arrivedFrom?: string;
}) {
  const { data, loading, error } = useQuery(NoteSummaryDocument, {
    variables: { id },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const navigation = useNavigation();
  const router = useRouter();
  const note = data?.note;

  useEffect(() => {
    if (!note?.userCanEdit) return;

    navigation.setOptions({
      headerRight: () => (
        <TextButton
          color={Colors.WHITE}
          regular
          title="Edit"
          accessibilityHint="goes to the edit interaction screen"
          onPress={() =>
            router.navigate({
              pathname: `/add-note/${id}`,
              params: {
                isEditing: 'true',
                arrivedFrom,
              },
            })
          }
        />
      ),
    });
  }, [note?.userCanEdit, id, arrivedFrom]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" />
      </View>
    );
  }

  if (error) throw new Error('Something went wrong. Please try again.');
  if (!note) return null;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <NoteTitle note={note} />
        <NoteClient clientProfile={note.clientProfile} />
        <NoteByline
          createdBy={note.createdBy}
          organization={note.organization}
          team={note.team}
        />
        {note.location?.point && <NoteLocation note={note} />}
        {(note.providedServices.length > 0 ||
          note.requestedServices.length > 0) && <NoteServices note={note} />}
        {note.publicDetails && <NotePublicNote note={note} />}
      </View>
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
    borderRadius: Radiuses.xs,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
});
