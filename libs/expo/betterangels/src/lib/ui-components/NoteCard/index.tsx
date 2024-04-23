import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { NoteType } from '../../apollo';
import NoteCardClient from './NoteCardClient';
import NoteCardHeader from './NoteCardHeader';
import NoteCardIcons from './NoteCardIcons';

interface INoteCardProps {
  note: NoteType;
}

export default function NoteCard(props: INoteCardProps) {
  const { note } = props;
  return (
    <View style={styles.container}>
      <NoteCardHeader
        isSubmitted={note.isSubmitted}
        title={note.title}
        interactedAt={note.interactedAt}
      />
      <NoteCardClient client={note.client} />
      <BodyText numberOfLines={2} ellipsizeMode="tail" size="sm">
        What Text should be here
      </BodyText>
      {(note.moods.length > 0 ||
        note.providedServices.length > 0 ||
        note.requestedServices.length > 0) && (
        <NoteCardIcons
          icons={[
            ...note.moods,
            ...note.providedServices,
            ...note.requestedServices,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacings.sm,
    gap: Spacings.xs,
    borderRadius: 8,
    backgroundColor: Colors.WHITE,
  },
});
