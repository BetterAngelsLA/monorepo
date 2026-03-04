import {
  KeyboardToolbarProvider,
  SnackbarProvider,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { BottomSheetModalProvider } from '@monorepo/expo/shared/ui-components';
import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';

export default function BaseModalScreen() {
  const { content } = useModalScreen();

  useEffect(() => {
    return () => {
      const screenH = Dimensions.get('screen');
      const windowH = Dimensions.get('window');

      console.log('');
      console.log(
        `*************** on Unmount - MODAL-SCREEN:  windowH: ${windowH.height} / screenH: ${screenH.height}`
      );
    };
  }, []);

  if (!content) {
    return null;
  }

  return (
    <BottomSheetModalProvider>
      <SnackbarProvider>
        <KeyboardToolbarProvider>
          <View
            style={{
              flex: 1,
              backgroundColor: Colors.WHITE,
              borderColor: 'red',
              borderWidth: 4,
            }}
          >
            {content}
          </View>
        </KeyboardToolbarProvider>
      </SnackbarProvider>
    </BottomSheetModalProvider>
  );
}
