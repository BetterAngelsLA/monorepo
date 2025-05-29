import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';

interface INoteCardHeaderProps {
  isSubmitted: boolean;
  interactedAt: string;
}

export default function NoteCardFooter(props: INoteCardHeaderProps) {
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
        <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
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
          <TextRegular size="sm" color={Colors.NEUTRAL_EXTRA_DARK}>
            Draft
          </TextRegular>
        </View>
      )}
    </View>
  );
}
