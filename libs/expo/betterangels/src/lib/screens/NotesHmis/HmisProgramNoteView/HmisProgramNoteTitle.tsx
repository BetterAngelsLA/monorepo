import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format, parseISO, startOfDay } from 'date-fns';
import { View } from 'react-native';
import { HmisNoteQuery } from './__generated__/HmisProgramNoteView.generated';

export default function HmisProgramNoteTitle({
  hmisNote,
}: {
  hmisNote: HmisNoteQuery['hmisNote'] | undefined;
}) {
  if (hmisNote?.__typename !== 'HmisNoteType') return null;

  const date = startOfDay(parseISO(hmisNote.date));

  return (
    <View>
      {hmisNote?.title && (
        <TextBold size="lg" mb="xs">
          {hmisNote?.title}
        </TextBold>
      )}
      {hmisNote.date && (
        <TextRegular mb="sm" size="sm">
          {format(date, 'MM/dd/yyyy')}
        </TextRegular>
      )}
    </View>
  );
}
