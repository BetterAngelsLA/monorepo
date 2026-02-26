import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format, parseISO, startOfDay } from 'date-fns';
import { View } from 'react-native';
import { ViewNoteHmisQuery } from './__generated__/NoteViewHmis.generated';

export default function NoteTitleHmis({
  hmisNote,
}: {
  hmisNote: ViewNoteHmisQuery['hmisNote'] | undefined;
}) {
  if (hmisNote?.__typename !== 'HmisNoteType') return null;

  const date = startOfDay(parseISO(hmisNote.date));

  return (
    <View>
      {hmisNote?.title && (
        <TextBold selectable size="lg" mb="xs">
          {hmisNote?.title}
        </TextBold>
      )}
      {hmisNote.date && (
        <TextRegular selectable mb="sm" size="sm">
          {format(date, 'MM/dd/yyyy')}
        </TextRegular>
      )}
    </View>
  );
}
