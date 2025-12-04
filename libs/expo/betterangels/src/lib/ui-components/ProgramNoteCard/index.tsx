import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { Pressable, StyleSheet } from 'react-native';
import { HmisNoteType } from '../../apollo';
import ProgramNoteCardClient from './ProgramNoteCardClient';
import ProgramNoteCardHeader from './ProgramNoteCardHeader';
import ProgramNoteCardServices from './ProgramNoteCardServices';

interface INoteCardProps {
  hmisNote: HmisNoteType;
  variant: 'interactions' | 'clientProfile';
  hasBorder?: boolean;
  onPress?: () => void;
}

export default function ProgramNoteCard(props: INoteCardProps) {
  const { hmisNote, variant, hasBorder, onPress } = props;
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
      {!!hmisNote.title && <ProgramNoteCardHeader purpose={hmisNote.title} />}
      {variant === 'interactions' && (
        <ProgramNoteCardClient clientProfile={hmisNote.hmisClientProfile} />
      )}
      {(!!hmisNote.providedServices?.length ||
        !!hmisNote.requestedServices?.length) && (
        <ProgramNoteCardServices note={hmisNote} />
      )}
      {hmisNote.date && (
        <TextRegular size="sm">
          {format(new Date(hmisNote.date), 'MM/dd/yyyy')}
          {' @ '}
          {format(new Date(hmisNote?.date), 'hh:mm a')}
        </TextRegular>
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
