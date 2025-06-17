import { KeyboardToolbarProvider, useModalScreen } from '@monorepo/expo/betterangels';
import { View } from 'react-native';

export default function BaseModalScreen() {
  const { modalContent, clearModalScreen } = useModalScreen();

  if (!modalContent) return null;

  return (
    <KeyboardToolbarProvider>
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {modalContent}
      </View>
    </KeyboardToolbarProvider>
  );
}
