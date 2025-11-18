import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { Pressable, StyleSheet } from 'react-native';
import { HmisClientNoteType } from '../../apollo';
import ProgramNoteCardClient from './ProgramNoteCardClient';
import ProgramNoteCardHeader from './ProgramNoteCardHeader';

interface INoteCardProps {
  note: HmisClientNoteType;
  variant: 'interactions' | 'clientProfile';
  hasBorder?: boolean;
  onPress?: () => void;
}

export default function ProgramNoteCard(props: INoteCardProps) {
  const { note, variant, hasBorder, onPress } = props;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor:
            pressed && onPress ? Colors.GRAY_PRESSED : Colors.WHITE,
          borderColor: Colors.NEUTRAL_LIGHT,
          borderWidth: hasBorder ? 1 : 0,
        },
      ]}
    >
      {!!note.title && <ProgramNoteCardHeader purpose={note.title} />}
      {variant === 'interactions' && (
        <ProgramNoteCardClient clientProfile={note.client} />
      )}
      {note.date && (
        <TextRegular size="sm">
          {format(new Date(note.date), 'MM/dd/yyyy')}
          {' @ '}
          {format(new Date(note?.date), 'hh:mm a')}
        </TextRegular>
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
