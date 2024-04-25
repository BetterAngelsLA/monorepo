import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, H4 } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';

export default function NotePublicNote({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <H4 mb="xs" size="sm">
        Public Note
      </H4>
      <View
        style={{
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          padding: Spacings.sm,
          borderRadius: 4,
        }}
      >
        <BodyText>{note?.publicDetails}</BodyText>
      </View>
    </View>
  );
}
