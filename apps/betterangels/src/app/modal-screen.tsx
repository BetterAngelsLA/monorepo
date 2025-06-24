import {
  KeyboardToolbarProvider,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { View } from 'react-native';

export default function BaseModalScreen() {
  const { content } = useModalScreen();

  if (!content) {
    return null;
  }

  return (
    <KeyboardToolbarProvider>
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.WHITE,
        }}
      >
        {content}
      </View>
    </KeyboardToolbarProvider>
  );
}
