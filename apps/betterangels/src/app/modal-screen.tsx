import {
  KeyboardToolbarProvider,
  ScreenHeader,
  ScreenHeaderCloseButton,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import { BottomSheetModalProvider } from '@monorepo/expo/shared/ui-components';
import { Platform, View } from 'react-native';

export default function BaseModalScreen() {
  const { content, title, presentation, header } = useModalScreen();

  if (!content) {
    return null;
  }

  return (
    <BottomSheetModalProvider>
      <KeyboardToolbarProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.WHITE,
          }}
        >
          {header?.mode === 'custom' && (
            <ScreenHeader
              variant={header.variant ?? 'modal'}
              title={title}
              // A page-sheet 'modal' starts below the notch already (iOS-only),
              // so the window's top inset would add a wrong gap there. Every
              // other presentation fills the window.
              topInset={
                Platform.OS === 'ios' && presentation === 'modal'
                  ? 0
                  : undefined
              }
              buttonLeft={header.buttonLeft}
              buttonRight={
                header.closeButton === false ? null : (
                  <ScreenHeaderCloseButton label={header.closeLabel} />
                )
              }
            />
          )}

          {content}
        </View>
      </KeyboardToolbarProvider>
    </BottomSheetModalProvider>
  );
}
