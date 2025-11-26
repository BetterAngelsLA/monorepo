import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { HmisNoteQuery } from './__generated__/HmisProgramNoteView.generated';

export default function HmisProgramNoteTitle({
  hmisNote,
}: {
  hmisNote: HmisNoteQuery['hmisNote'] | undefined;
}) {
  if (hmisNote?.__typename !== 'HmisNoteType') return null;

  return (
    <View>
      {hmisNote?.title && (
        <TextBold size="lg" mb="xs">
          {hmisNote?.title}
        </TextBold>
      )}
      {hmisNote.date && (
        <TextRegular mb="sm" size="sm">
          {format(new Date(hmisNote.date), 'MM/dd/yyyy')}
          {' @ '}
          {format(new Date(hmisNote?.date), 'hh:mm a')}
        </TextRegular>
      )}
    </View>
  );
}
