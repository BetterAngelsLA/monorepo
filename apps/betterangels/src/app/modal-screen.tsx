import {
  KeyboardToolbarProvider,
  SnackbarProvider,
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
    // Not including <BottomSheetModalProvider> here as the app BottomSheetModalProvider
    // is configured to use a custom containerComponent. This solves the stacking issue and
    // keeping only a single BottomSheetModalProvider at root prevents stale layout calculations
    // as switching between root and modal-screen etc...
    <SnackbarProvider>
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
    </SnackbarProvider>
  );
}
