import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Loading, TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ViewNoteQuery, useViewNoteQuery } from '../../apollo';
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

export default function Note({
  id,
  arrivedFrom,
}: {
  id: string;
  arrivedFrom?: string;
}) {
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
          onPress={() =>
            router.navigate({
              pathname: `/add-note/${id}`,
              params: {
                revertBeforeTimestamp: new Date().toISOString(),
                arrivedFrom,
              },
            })
          }
          title="Edit"
          accessibilityHint="goes to the edit interaction screen"
        />
      ),
    });
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        }}
      >
        <Loading size="large" />
      </View>
    );
  }

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
});
