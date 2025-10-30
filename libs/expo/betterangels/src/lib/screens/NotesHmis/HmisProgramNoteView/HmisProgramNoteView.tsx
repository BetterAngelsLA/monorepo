import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { LoadingView } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { MainScrollContainer } from '../../../ui-components';
import { useHmisProgramNoteViewQuery } from './__generated__/HmisProgramNoteView.generated';
import HmisProgramNoteTitle from './HmisProgramNoteTitle';

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

  if (error) throw new Error('Something went wrong. Please try again.');
  if (programNote?.__typename !== 'HmisClientNoteType') return null;

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View style={styles.container}>
        <HmisProgramNoteTitle programNote={programNote} />
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
