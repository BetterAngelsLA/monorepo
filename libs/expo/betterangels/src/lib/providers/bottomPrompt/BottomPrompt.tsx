import { Spacings } from '@monorepo/expo/shared/static';
import { CloseButton } from '@monorepo/expo/shared/ui-components';
import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { runBottomPromptAnimation } from './animations';

const KEYBOARD_OFFSET = 10;
const DEFAULT_PADDING_H = Spacings.md;

const DEFAULT_SCREEN_RATIO = 0.4;
const MAX_SCREEN_RATIO = 0.9;

type TProps = {
  children: ReactNode;
  isVisible: boolean;
  onRequestClose: () => void;
  onCloseStart?: () => void;
  onCloseEnd?: () => void;
  sheetHeight?: number;
  hideCloseButton?: boolean;
  topNavStyle?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function BottomPrompt(props: TProps) {
  const {
    children,
    isVisible,
    onRequestClose,
    onCloseStart,
    onCloseEnd,
    sheetHeight,
    hideCloseButton,
    topNavStyle,
    contentStyle,
  } = props;

  const { height: screenHeight } = useWindowDimensions();

  const defaultHeight = screenHeight * DEFAULT_SCREEN_RATIO;
  const requestedHeight = sheetHeight ?? defaultHeight;

  const finalSheetHeight = Math.min(
    requestedHeight,
    screenHeight * MAX_SCREEN_RATIO
  );

  const translateY = useRef(new Animated.Value(finalSheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isClosingRef = useRef<boolean>(false);

  function runEnter() {
    isClosingRef.current = false;

    translateY.setValue(finalSheetHeight);

    runBottomPromptAnimation('enter', {
      translateY,
      backdropOpacity,
      sheetHeight: finalSheetHeight,
    });
  }

  function runExit() {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    runBottomPromptAnimation(
      'exit',
      {
        translateY,
        backdropOpacity,
        sheetHeight: finalSheetHeight,
      },
      onCloseEnd
    );
  }

  useEffect(() => {
    if (isVisible) {
      runEnter();
      return;
    }

    runExit();
  }, [isVisible, finalSheetHeight, runEnter, runExit]);

  function handleClose() {
    onCloseStart?.();
    onRequestClose();
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Close modal"
          accessibilityHint="Closes the bottom prompt"
        />
      </Animated.View>

      {/*
        Sheet
        - Note: the react-native-keyboard-controller KeyboardAvoidingView
        at full height blocks pointer events, hence the fullscreenContainer */}
      <View style={styles.fullscreenContainer} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={KEYBOARD_OFFSET}
        >
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.animatedSheet,
              {
                height: finalSheetHeight,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.sheet]}>
              {!hideCloseButton && (
                <View style={[styles.topNav, topNavStyle]}>
                  <CloseButton
                    style={{ minWidth: 0 }}
                    accessibilityHint="closes the bottom prompt modal"
                    onClose={handleClose}
                  />
                </View>
              )}

              <View style={[styles.content, contentStyle]}>{children}</View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  fullscreenContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  animatedSheet: {
    width: '100%',
  },

  topNav: { paddingHorizontal: DEFAULT_PADDING_H },

  sheet: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: Spacings.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },

  content: {
    flex: 1,
  },
});
