import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { NotesQuery } from '../../apollo';
import NoteCardClient from './NoteCardClient';
import NoteCardHeader from './NoteCardHeader';
import NoteCardIcons from './NoteCardIcons';

interface INoteCardProps {
  note: NotesQuery['notes'][0];
}

export default function NoteCard(props: INoteCardProps) {
  const { note } = props;
  const pathname = usePathname();
  const router = useRouter();

  const isInteractionsPage = pathname === '/interactions';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.navigate({
          pathname: `/note/${note.id}`,
          params: { arrivedFrom: pathname },
        })
      }
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
        },
      ]}
    >
      <NoteCardHeader title={note.title} interactedAt={note.interactedAt} />
      <NoteCardClient
        client={isInteractionsPage ? note.client : note.createdBy}
        isSubmitted={note.isSubmitted}
      />
      {(note.providedServices.length > 0 ||
        note.requestedServices.length > 0) && (
        <NoteCardIcons
          icons={[
            // ...note.moods, // TODO: will be back soon
            ...note.providedServices,
            ...note.requestedServices,
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacings.sm,
    gap: Spacings.xs,
    borderRadius: Radiuses.xs,
  },
});
