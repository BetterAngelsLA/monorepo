import { CloseButton } from '@monorepo/expo/shared/ui-components';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { TAnimationContext, runBottomPromptAnimation } from './animations';

type TProps = {
  children: ReactNode;
  onRequestClose: () => void;
  onCloseEnd?: () => void;
  maxHeightRatio?: number;
  hideCloseButton?: boolean;
};

export function BottomPrompt(props: TProps) {
  const {
    children,
    onRequestClose,
    onCloseEnd,
    maxHeightRatio = 0.4,
    hideCloseButton,
  } = props;

  const isClosingRef = useRef<boolean>(false);

  const { height: screenHeight } = useWindowDimensions();

  const sheetHeight = Math.min(screenHeight * maxHeightRatio, 360);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animationContext: TAnimationContext = {
    translateY,
    backdropOpacity,
    sheetHeight,
  };

  useEffect(() => {
    runBottomPromptAnimation('enter', animationContext);
  }, [animationContext]);

  const animateClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    runBottomPromptAnimation('exit', animationContext, props.onCloseEnd);
  }, [animationContext, props.onCloseEnd]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            onRequestClose();
            animateClose();
          }}
        />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {!hideCloseButton && (
            <CloseButton
              style={{ minWidth: 0 }}
              accessibilityHint="closes the bottom prompt modal"
              onClose={() => {
                onRequestClose();
                animateClose();
              }}
            />
          )}
          {children}
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
    padding: 16,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,

    borderColor: 'blue',
    borderWidth: 4,
  },
});
