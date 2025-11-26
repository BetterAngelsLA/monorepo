import { Colors } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';

interface IProgramNoteCardFooterProps {
  interactedAt: string;
}

export default function ProgramNoteCardFooter(
  props: IProgramNoteCardFooterProps
) {
  const { interactedAt } = props;
  return (
    <View
      style={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <TextRegular size="xsm" color={Colors.NEUTRAL_DARK}>
          {format(new Date(interactedAt), 'MM/dd/yyyy')}
        </TextRegular>
      </View>
    </View>
  );
}
