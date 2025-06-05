import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { NotesQuery } from '../../apollo';
import NoteCardByline from './NoteCardByline';
import NoteCardClient from './NoteCardClient';
import NoteCardFooter from './NoteCardFooter';
import NoteCardHeader from './NoteCardHeader';
import NoteCardServices from './NoteCardServices';

interface INoteCardProps {
  note: NotesQuery['notes']['results'][0];
  variant: 'interactions' | 'clientProfile';
}

export default function NoteCard(props: INoteCardProps) {
  const { note, variant } = props;
  const pathname = usePathname();
  const router = useRouter();

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
      {!!note.purpose && <NoteCardHeader purpose={note.purpose} />}
      {variant === 'interactions' && (
        <NoteCardClient clientProfile={note.clientProfile} />
      )}
      <NoteCardByline
        createdBy={note.createdBy}
        organization={note.organization}
        team={note.team}
      />
      {(!!note.providedServices.length || !!note.requestedServices.length) && (
        <NoteCardServices note={note} />
      )}
      <NoteCardFooter
        interactedAt={note.interactedAt}
        isSubmitted={note.isSubmitted}
      />
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
