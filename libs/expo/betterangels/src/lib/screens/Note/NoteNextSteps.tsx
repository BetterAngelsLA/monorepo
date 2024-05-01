import { SolidCircleIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { ViewNoteQuery } from '../../apollo';

export default function NoteNextSteps({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View>
      <TextBold mb="xs" size="sm">
        Next Steps
      </TextBold>
      {note?.nextSteps.map((step, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacings.xs,
          }}
        >
          <SolidCircleIcon size="xs" color={Colors.PRIMARY_EXTRA_DARK} />
          <TextRegular size="sm" ml="xs">
            {step.title}
          </TextRegular>
        </View>
      ))}
    </View>
  );
}
