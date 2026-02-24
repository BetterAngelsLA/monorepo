import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteHmisQuery } from './__generated__/ProgramNoteViewHmis.generated';

export default function ProgramNoteHmis({
  hmisNote,
}: {
  hmisNote: ViewNoteHmisQuery['hmisNote'] | undefined;
}) {
  if (hmisNote?.__typename !== 'HmisNoteType') return null;
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
        <TextRegular size="sm">{hmisNote?.note}</TextRegular>
      </View>
    </View>
  );
}
