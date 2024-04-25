import { BodyText, H2 } from '@monorepo/expo/shared/ui-components';
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
      <H2 mb="xs">{note?.title}</H2>
      <BodyText size="sm">
        {format(new Date(note?.interactedAt), 'MM/dd/yyyy')}
      </BodyText>
    </View>
  );
}
