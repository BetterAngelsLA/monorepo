import { useQuery } from '@apollo/client/react';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  LoadingView,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { sanitizeHtmlString } from '@monorepo/expo/shared/utils';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import HmisProgramNoteTitle from './HmisProgramNoteTitle';
import { HmisNoteDocument } from './__generated__/HmisProgramNoteView.generated';

type TProps = {
  clientHmisId: string;
  noteHmisId: string;
};

export function HmisProgramNoteView(props: TProps) {
  const { clientHmisId, noteHmisId } = props;

  const { data, error, loading } = useQuery(HmisNoteDocument, {
    variables: {
      clientHmisId,
      noteHmisId,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log(data);
  const hmisNote = data?.hmisNote;

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    throw new Error('Something went wrong. Please try again.');
  }

  if (hmisNote?.__typename !== 'HmisClientNoteType') {
    return null;
  }

  const { note, client, enrollment } = hmisNote;
  const { firstName, lastName } = client || {};
  const { project } = enrollment || {};

  const programName = project?.projectName;
  const clientName = buildFullName(firstName, lastName);
  const sanitizedNote = sanitizeHtmlString(note);

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
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
