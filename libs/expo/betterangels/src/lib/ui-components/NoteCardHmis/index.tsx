import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format, parseISO, startOfDay } from 'date-fns';
import { Pressable, StyleSheet } from 'react-native';
import { InteractionListHmisQuery } from '../InteractionListHmis/__generated__/interactionListHmis.generated';
import NoteCardBylineHmis from './NoteCardBylineHmis';
import NoteCardClientHmis from './NoteCardClientHmis';
import NoteCardHeaderHmis from './NoteCardHeaderHmis';
import NoteCardServicesHmis from './NoteCardServicesHmis';

interface INoteCardProps {
  hmisNote: InteractionListHmisQuery['hmisNotes']['results'][number];
  variant: 'interactions' | 'clientProfile';
  hasBorder?: boolean;
  onPress?: () => void;
}

export default function NoteCardHmis(props: INoteCardProps) {
  const { hmisNote, variant, hasBorder, onPress } = props;
  const date = startOfDay(parseISO(hmisNote.date));

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
      {!!hmisNote.title && <NoteCardHeaderHmis purpose={hmisNote.title} />}
      {variant === 'interactions' && (
        <NoteCardClientHmis clientProfile={hmisNote.hmisClientProfile} />
      )}
      <NoteCardBylineHmis createdBy={hmisNote.createdBy} />
      {(!!hmisNote.providedServices?.length ||
        !!hmisNote.requestedServices?.length) && (
        <NoteCardServicesHmis note={hmisNote} />
      )}
      {hmisNote.date && (
        <TextRegular size="sm">{format(date, 'MM/dd/yyyy')}</TextRegular>
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
