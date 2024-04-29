import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';

export default function NotePublicNote({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold mb="xs" size="sm">
        Public Note
      </TextBold>
      <View
        style={{
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          padding: Spacings.sm,
          borderRadius: 4,
        }}
      >
        <TextRegular>{note?.publicDetails}</TextRegular>
      </View>
    </View>
  );
}
