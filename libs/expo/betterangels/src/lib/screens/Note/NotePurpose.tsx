import { CircleSolidIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';

export default function NotePurpose({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold mb="xs" size="sm">
        Purpose
      </TextBold>
      {note?.purposes.map((purpose, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacings.xs,
          }}
        >
          <CircleSolidIcon size="xs" color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular size="sm" ml="xs">
            {purpose.title}
          </TextRegular>
        </View>
      ))}
    </View>
  );
}
