import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

interface INoteCardHeaderProps {
  purpose: string | null | undefined;
}

export default function NoteCardHeader(props: INoteCardHeaderProps) {
  const { purpose } = props;
  return (
    <View
      style={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flex: 2,
          alignItems: 'center',
        }}
      >
        <TextBold
          numberOfLines={2}
          ellipsizeMode="tail"
          size="md"
          color={Colors.PRIMARY_EXTRA_DARK}
        >
          {purpose}
        </TextBold>
      </View>
    </View>
  );
}
