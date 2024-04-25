import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, H4 } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';

export default function NotePurpose({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <H4 mb="xs" size="sm">
        Purpose
      </H4>
      {note?.purposes.map((purpose, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacings.xs,
          }}
        >
          <SolidCircleIcon size="xs" color={Colors.PRIMARY_EXTRA_DARK} />
          <BodyText size="sm" ml="xs">
            {purpose.title}
          </BodyText>
        </View>
      ))}
    </View>
  );
}
