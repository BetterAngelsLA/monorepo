import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Loading, TextButton } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { MainScrollContainer } from '../../ui-components';
import { useNoteSummaryQuery } from './__generated__/NoteSummary.generated';
import NoteByline from './NoteByline';
import NoteClient from './NoteClient';
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
  const { data, loading, error } = useNoteSummaryQuery({
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

  if (!data?.note) {
    return null;
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <NoteTitle note={data?.note} />
        <NoteClient clientProfile={data?.note.clientProfile} />
        <NoteByline
          createdBy={data?.note.createdBy}
          organization={data?.note.organization}
          team={data?.note.team}
        />
        {data?.note.location?.point && <NoteLocation note={data?.note} />}
        {(!!data.note.providedServices.length ||
          !!data.note.requestedServices.length) && (
          <NoteServices note={data.note} />
        )}
        {data?.note.publicDetails && <NotePublicNote note={data.note} />}
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
