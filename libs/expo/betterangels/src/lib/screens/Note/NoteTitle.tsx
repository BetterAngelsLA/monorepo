import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';

export default function NoteTitle({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold size="lg" mb="xs">
        {note?.title}
      </TextBold>
      <TextRegular size="sm">
        {format(new Date(note?.interactedAt), 'MM/dd/yyyy')}
      </TextRegular>
    </View>
  );
}
