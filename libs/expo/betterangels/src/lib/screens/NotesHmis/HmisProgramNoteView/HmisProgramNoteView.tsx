import { useQuery } from '@apollo/client/react';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  LoadingView,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { sanitizeHtmlString } from '@monorepo/expo/shared/utils';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react'; // 1. Import useRef
import { ScrollView, StyleSheet, View } from 'react-native'; // 1. Import ScrollView type
// Ensure this path is correct for your project structure
import { MainScrollContainer, NoteTasks } from '../../../ui-components'; // 2. Import NoteTasks
import HmisProgramNoteTitle from './HmisProgramNoteTitle';
import { HmisNoteWithTasksDocument } from './__generated__/HmisProgramNoteView.generated';

type TProps = {
  id: string;
  clientId: string;
};

export function HmisProgramNoteView(props: TProps) {
  const { id, clientId } = props;

  // 3. Create the Scroll Ref
  const scrollRef = useRef<ScrollView>(null);

  const { data, error, loading, refetch } = useQuery(
    HmisNoteWithTasksDocument,
    {
      variables: { id },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    }
  );
  const hmisNote = data?.hmisNote;
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TextButton
          color={Colors.WHITE}
          regular
          title="Edit"
          accessibilityHint="edit note form"
          onPress={() =>
            router.navigate({
              pathname: `notes-hmis/${id}/edit`,
              params: { clientId },
            })
          }
        />
      ),
    });
  }, [id, clientId, navigation, router]);

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    console.error(
      'HmisProgramNoteView Query Error:',
      JSON.stringify(error, null, 2)
    );
    return (
      <View style={{ padding: 20 }}>
        <TextRegular color={Colors.ERROR}>
          Unable to load note details. See console for errors.
        </TextRegular>
      </View>
    );
  }

  if (hmisNote?.__typename !== 'HmisNoteType') {
    return null;
  }

  // Ensure 'tasks' is included in your Graphql query definition for HmisNoteDocument
  const { note, hmisClientProfile, clientProgram, tasks } = hmisNote;
  const { firstName, lastName } = hmisClientProfile || {};
  const { program } = clientProgram || {};
  const programName = program?.name;
  const clientName = buildFullName(firstName, lastName);
  const sanitizedNote = sanitizeHtmlString(note);

  return (
    // 4. Pass the scrollRef to your container so NoteTasks can reference it
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} scrollRef={scrollRef}>
      <View style={styles.container}>
        <HmisProgramNoteTitle hmisNote={hmisNote} />

        {!!clientName && <TextBold>{clientName}</TextBold>}

        {programName && (
          <View>
            <TextBold mb="xs">Program</TextBold>
            <TextRegular>{programName}</TextRegular>
          </View>
        )}

        {!!sanitizedNote.length && (
          <View>
            <TextBold mb="xs">Note</TextBold>
            <View style={styles.noteContainer}>
              <TextRegular>{sanitizedNote}</TextRegular>
            </View>
          </View>
        )}
      </View>

      {/* 5. Render NoteTasks */}
      <NoteTasks
        clientProfileId={clientId}
        noteId={id}
        tasks={tasks}
        refetch={refetch}
        scrollRef={scrollRef}
        team={null}
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
    gap: Spacings.md,
    borderRadius: Radiuses.xs,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
  },
  noteContainer: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    padding: Spacings.sm,
    borderRadius: Radiuses.xxs,
  },
});

function buildFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const nameParts = [];

  if (firstName) {
    nameParts.push(firstName);
  }

  if (lastName) {
    nameParts.push(lastName);
  }

  const name = nameParts.join(' ');

  return name.trim();
}
