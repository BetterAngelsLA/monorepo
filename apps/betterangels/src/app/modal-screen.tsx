import { useModalScreen } from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { View } from 'react-native';

export default function BaseModalScreen() {
  const { content } = useModalScreen();

  if (!content) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
      }}
    >
      {content}
    </View>
  );
}
