import {
  KeyboardToolbarProvider,
  SnackbarProvider,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { BottomSheetModalProvider } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

export default function BaseModalScreen() {
  const { content } = useModalScreen();

  if (!content) {
    return null;
  }

  return (
    <SnackbarProvider>
      <BottomSheetModalProvider>
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
      </BottomSheetModalProvider>
    </SnackbarProvider>
  );
}
