import { Spacings } from '@monorepo/expo/shared/static';
import { CloseButton } from '@monorepo/expo/shared/ui-components';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { runBottomPromptAnimation } from './animations';

const MIN_SHEET_HEIGHT = 160;

type TProps = {
  children: ReactNode;
  isVisible: boolean;
  onRequestClose: () => void;
  onCloseStart?: () => void;
  onCloseEnd?: () => void;
  maxHeightRatio?: number;
  hideCloseButton?: boolean;
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
  } = props;

  const isClosingRef = useRef<boolean>(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const { height: screenHeight } = useWindowDimensions();

  const maxSheetHeight = Math.min(screenHeight * maxHeightRatio, 960);
  const fallbackHeight = maxSheetHeight;

  const measuredHeight =
    contentHeight === null
      ? null
      : Math.min(Math.max(contentHeight, MIN_SHEET_HEIGHT), maxSheetHeight);

  const translateY = useRef(new Animated.Value(fallbackHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const hasMeasuredHeight = measuredHeight !== null;

  const renderedHeight =
    measuredHeight !== null ? measuredHeight : fallbackHeight;

  function runEnter() {
    if (!hasMeasuredHeight) {
      return;
    }

    isClosingRef.current = false;

    translateY.setValue(renderedHeight);

    runBottomPromptAnimation('enter', {
      translateY,
      backdropOpacity,
      sheetHeight: renderedHeight,
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
        sheetHeight: renderedHeight,
      },
      onCloseEnd
    );
  }

  useEffect(() => {
    isVisible ? runEnter() : runExit();
  }, [
    isVisible,
    hasMeasuredHeight,
    renderedHeight,
    translateY,
    backdropOpacity,
    onCloseEnd,
  ]);

  function handleClose() {
    onCloseStart?.();
    onRequestClose();
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Content wrapper */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}
      >
        <Animated.View
          style={[
            {
              height: renderedHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Sheet */}
          <View
            style={styles.sheet}
            onLayout={(e) => {
              const nextHeight = e.nativeEvent.layout.height;

              setContentHeight((prev) =>
                prev === nextHeight ? prev : nextHeight
              );
            }}
          >
            {!hideCloseButton && (
              <CloseButton
                style={{ minWidth: 0 }}
                accessibilityHint="closes the bottom prompt modal"
                onClose={handleClose}
              />
            )}
            <View>{children}</View>
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
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: Spacings.md,
    paddingTop: Spacings.md,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
});
