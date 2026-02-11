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

const TOOLBAR_HEIGHT = 44;
const DEFAULT_PADDING_H = Spacings.md;

type TProps = {
  children: ReactNode;
  isVisible: boolean;
  onRequestClose: () => void;
  onCloseStart?: () => void;
  onCloseEnd?: () => void;
  maxHeightRatio?: number;
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
    maxHeightRatio = 0.4,
    hideCloseButton,
    topNavStyle,
    contentStyle,
  } = props;

  const { height: screenHeight } = useWindowDimensions();

  const maxSheetHeight = Math.min(screenHeight * maxHeightRatio, 960);

  const translateY = useRef(new Animated.Value(maxSheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isClosingRef = useRef<boolean>(false);

  function runEnter() {
    isClosingRef.current = false;

    translateY.setValue(maxSheetHeight);

    runBottomPromptAnimation('enter', {
      translateY,
      backdropOpacity,
      sheetHeight: maxSheetHeight,
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
        sheetHeight: maxSheetHeight,
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
  }, [isVisible, maxSheetHeight, runEnter, runExit]);

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

      {/* Bottom sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? TOOLBAR_HEIGHT : 0}
        style={styles.keyboardAvoider}
      >
        <Animated.View
          style={[
            styles.animatedSheet,
            {
              height: maxSheetHeight,
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
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  keyboardAvoider: {
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
