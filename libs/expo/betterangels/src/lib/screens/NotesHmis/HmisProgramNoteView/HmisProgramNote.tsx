import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { HmisProgramNoteViewQuery } from './__generated__/HmisProgramNoteView.generated';

export default function HmisProgramNote({
  programNote,
}: {
  programNote: HmisProgramNoteViewQuery['hmisGetClientNote'] | undefined;
}) {
  if (programNote?.__typename !== 'HmisClientNoteType') return null;
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
        <TextRegular size="sm">{programNote?.note}</TextRegular>
      </View>
    </View>
  );
}
