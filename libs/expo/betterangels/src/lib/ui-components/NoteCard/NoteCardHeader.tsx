import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

interface INoteCardHeaderProps {
  purpose: string | null | undefined;
}

export default function NoteCardHeader(props: INoteCardHeaderProps) {
  const { purpose } = props;
  return (
    <View style={{ flexDirection: 'row', marginBottom: Spacings.xs }}>
      <TextMedium
        numberOfLines={2}
        ellipsizeMode="tail"
        size="md"
        color={Colors.PRIMARY_EXTRA_DARK}
      >
        {purpose}
      </TextMedium>
    </View>
  );
}
