import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Loading, TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useViewNoteQuery } from '../../apollo';
import { MainScrollContainer } from '../../ui-components';
import NoteAttachments from './NoteAttachments';
import NoteLocation from './NoteLocation';
import NotePublicNote from './NotePublicNote';
import NoteServices from './NoteServices';
import NoteTitle from './NoteTitle';

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
        {!!data?.note.providedServices.length && (
          <NoteServices type="providedServices" data={data} />
        )}
        {!!data?.note.requestedServices.length && (
          <NoteServices type="requestedServices" data={data} />
        )}
        {data?.note.publicDetails && <NotePublicNote note={data?.note} />}
        {!!data?.note.attachments.length && (
          <NoteAttachments note={data?.note} />
        )}
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
