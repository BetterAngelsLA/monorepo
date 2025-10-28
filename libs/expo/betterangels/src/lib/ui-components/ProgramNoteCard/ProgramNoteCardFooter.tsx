import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';

interface IProgramNoteCardFooterProps {
  isSubmitted: boolean;
  interactedAt: string;
}

export default function ProgramNoteCardFooter(
  props: IProgramNoteCardFooterProps
) {
  const { isSubmitted, interactedAt } = props;
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
      {!isSubmitted && (
        <View
          style={{
            backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
            paddingHorizontal: Spacings.xxs,
            borderRadius: 20,
          }}
        >
          <TextRegular size="xs" color={Colors.NEUTRAL_EXTRA_DARK}>
            Draft
          </TextRegular>
        </View>
      )}
    </View>
  );
}
