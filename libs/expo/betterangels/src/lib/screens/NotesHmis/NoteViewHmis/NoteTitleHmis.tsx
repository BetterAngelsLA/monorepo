import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { formatDateString } from '@monorepo/shared/scalars';
import { View } from 'react-native';
import { ViewNoteHmisQuery } from './__generated__/NoteViewHmis.generated';

export default function NoteTitleHmis({
  hmisNote,
}: {
  hmisNote: ViewNoteHmisQuery['hmisNote'] | undefined;
}) {
  if (hmisNote?.__typename !== 'HmisNoteType') return null;

  const date = formatDateString(hmisNote.date, 'MM/dd/yyyy');

  return (
    <View>
      {hmisNote?.title && (
        <TextBold selectable size="lg" mb="xs">
          {hmisNote?.title}
        </TextBold>
      )}
      {date && (
        <TextRegular selectable mb="sm" size="sm">
          {date}
        </TextRegular>
      )}
    </View>
  );
}
