import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  LoadingView,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import HmisProgramNoteTitle from './HmisProgramNoteTitle';
import { useHmisProgramNoteViewQuery } from './__generated__/HmisProgramNoteView.generated';

type TProps = {
  id: string;
  personalId: string;
  enrollmentId: string;
};

export function HmisProgramNoteView(props: TProps) {
  const { id, personalId, enrollmentId } = props;

  const { data, error, loading } = useHmisProgramNoteViewQuery({
    variables: {
      id,
      personalId,
      enrollmentId,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const programNote = data?.hmisGetClientNote;

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    throw new Error('Something went wrong. Please try again.');
  }

  if (programNote?.__typename !== 'HmisClientNoteType') {
    return null;
  }

  const { note, client, enrollment } = programNote;
  const { firstName, lastName } = client || {};
  const { project } = enrollment || {};

  const programName = project?.projectName;
  const clientName = buildFullName(firstName, lastName);
  const sanitizedNote = (note || '').replace(/<[^>]+>/g, '');
  const sanitizedNoteTrimmed = sanitizedNote.trim();

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <HmisProgramNoteTitle programNote={programNote} />

        {!!clientName && <TextBold>{clientName}</TextBold>}

        {programName && (
          <View>
            <TextBold mb="xs">Program</TextBold>
            <TextRegular>{programName}</TextRegular>
          </View>
        )}

        {!!sanitizedNoteTrimmed.length && (
          <View>
            <TextBold mb="xs">Note</TextBold>
            <View style={styles.noteContainer}>
              <TextRegular>{sanitizedNoteTrimmed}</TextRegular>
            </View>
          </View>
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
