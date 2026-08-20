import {
  KeyboardToolbarProvider,
  ScreenHeader,
  ScreenHeaderButton,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { Colors } from '@monorepo/expo/shared/static';
import {
  BottomSheetModalProvider,
  TextBold,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function BaseModalScreen() {
  const { content, title, presentation, headerVariant, headerCloseLabel } =
    useModalScreen();

  const router = useRouter();

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
          {/*
            Rendered inside BottomSheetModalProvider on purpose:
            BottomSheetLayoutProvider measures that provider's own view, so
            keeping the header inside it leaves the container at the window's
            full height — which is what lets a '100%' sheet (the camera) cover
            the header too. Moving this outside silently caps sheets short.

            Opt-in: without `headerVariant` nothing is drawn, so callers still
            on the native header are untouched. `hideHeader` turns the native
            one off; the two are set together.
          */}
          {!!headerVariant && (
            <ScreenHeader
              variant={headerVariant}
              title={title}
              // A page-sheet 'modal' starts below the notch already, so the
              // window's top inset would add a wrong gap there. Every other
              // presentation fills the window.
              topInset={presentation === 'modal' ? 0 : undefined}
              buttonRight={
                headerCloseLabel ? (
                  <ScreenHeaderButton
                    onPress={router.back}
                    accessibilityHint="closes the screen"
                    testId="modal-screen-close-btn"
                  >
                    <TextBold color={Colors.WHITE}>{headerCloseLabel}</TextBold>
                  </ScreenHeaderButton>
                ) : undefined
              }
            />
          )}

          {content}
        </View>
      </KeyboardToolbarProvider>
    </BottomSheetModalProvider>
  );
}
