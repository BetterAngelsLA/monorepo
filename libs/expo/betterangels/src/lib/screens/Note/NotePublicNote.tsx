import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { NoteSummaryQuery } from './__generated__/NoteSummary.generated';

export default function NotePublicNote({
  note,
}: {
  note: NoteSummaryQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold mb="xs" size="sm">
        Note
      </TextBold>
      <View
        style={{
          backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
          padding: Spacings.sm,
          borderRadius: Radiuses.xxs,
        }}
      >
        <TextRegular size="sm">{note?.publicDetails}</TextRegular>
      </View>
    </View>
  );
}
