import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { HmisClientNoteListType } from '../../apollo';
import ProgramNoteCardClient from './ProgramNoteCardClient';
import ProgramNoteCardHeader from './ProgramNoteCardHeader';

interface INoteCardProps {
  note: HmisClientNoteListType['items'][number];
  variant: 'interactions' | 'clientProfile';
  hasBorder?: boolean;
  onPress?: () => void;
}

export default function ProgramNoteCard(props: INoteCardProps) {
  const { note, variant, hasBorder, onPress } = props;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (onPress) {
          onPress();
        }
        router.navigate({
          pathname: `/note/${note.id}`,
          params: { arrivedFrom: pathname },
        });
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? Colors.GRAY_PRESSED : Colors.WHITE,
          borderColor: Colors.NEUTRAL_LIGHT,
          borderWidth: hasBorder ? 1 : 0,
        },
      ]}
    >
      {!!note.title && <ProgramNoteCardHeader purpose={note.title} />}
      {variant === 'interactions' && (
        <ProgramNoteCardClient clientProfile={note.client} />
      )}

      {/* TODO: ADD AFTER BA INTEGRATION
      <ProgramNoteCardByline
        createdBy={note.createdBy}
        organization={note.organization}
        team={note.team}
      />

      {(!!note.providedServices.length || !!note.requestedServices.length) && (
        <ProgramNoteCardServices note={note} />
      )}
      <ProgramNoteCardFooter
        interactedAt={note.interactedAt}
        isSubmitted={note.isSubmitted}
      /> */}
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
