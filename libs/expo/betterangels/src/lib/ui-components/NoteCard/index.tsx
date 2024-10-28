import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { NotesQuery } from '../../apollo';
import NoteCardClient from './NoteCardClient';
import NoteCardHeader from './NoteCardHeader';
import NoteCardPills from './NoteCardPills';

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
      <NoteCardHeader purpose={note.purpose} interactedAt={note.interactedAt} />
      <NoteCardClient
        client={isInteractionsPage ? note.client : note.createdBy}
        isSubmitted={note.isSubmitted}
      />
      {!!note.providedServices.length && (
        <NoteCardPills type="success" services={note.providedServices} />
      )}
      {!!note.requestedServices.length && (
        <NoteCardPills type="primary" services={note.requestedServices} />
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
