import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { HmisProgramNoteViewQuery } from './__generated__/HmisProgramNoteView.generated';

export default function HmisProgramNoteTitle({
  programNote,
}: {
  programNote: HmisProgramNoteViewQuery['hmisGetClientNote'] | undefined;
}) {
  if (programNote?.__typename !== 'HmisClientNoteType') return null;

  return (
    <View>
      {programNote?.title && (
        <TextBold size="lg" mb="xs">
          {programNote?.title}
        </TextBold>
      )}
      {programNote.date && (
        <TextRegular mb="sm" size="sm">
          {format(new Date(programNote.date), 'MM/dd/yyyy')}
          {' @ '}
          {format(new Date(programNote?.date), 'hh:mm a')}
        </TextRegular>
      )}
      {programNote.category && (
        <>
          <TextBold size="sm">Category</TextBold>
          <TextRegular size="sm">{programNote.category}</TextRegular>
        </>
      )}
    </View>
  );
}
