import { Colors } from '@monorepo/expo/shared/static';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Modal as RNModal,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModalHeader } from './ModalHeader';

export interface IFileViewerModal extends PropsWithChildren {
  title?: string | null;
  isOpen: boolean;
  setIsOpen?: (open: boolean) => void;
  onClose?: () => void;

  /** 'fullscreen' uses RN Modal slide; 'sheet' is a card with our own animation/backdrop */
  variant?: 'fullscreen' | 'sheet';

  /** Sheet options */
  direction?: 'up' | 'right'; // 'up' = bottom sheet, 'right' = right drawer
  panelOffset?: number; // left margin for right drawer
  backdropOpacity?: number; // 0..1
  sheetTopPadding?: number; // extra top padding for 'up' sheets

  /** Style overrides */
  panelStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

const OPEN_MS = 260;
const CLOSE_MS = 220;

export function BaseModal({
  title,
  isOpen,
  setIsOpen,
  onClose,
  children,
  variant = 'fullscreen',
  direction = 'up',
  panelOffset = 0,
  backdropOpacity = 0.5,
  sheetTopPadding = 0,
  panelStyle,
  contentStyle,
}: IFileViewerModal) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [mounted, setMounted] = useState(isOpen);

  // single progress drives both panel + backdrop
  const t = useRef(new Animated.Value(0)).current;

  const OFF = direction === 'right' ? screenW : screenH;

  const animate = useCallback(
    (open: boolean) => {
      Animated.timing(t, {
        toValue: open ? 1 : 0,
        duration: open ? OPEN_MS : CLOSE_MS,
        easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !open) {
          setMounted(false);
          onClose?.();
          setIsOpen?.(false);
        }
      });
    },
    [t, onClose, setIsOpen]
  );

  useEffect(() => {
    if (variant === 'sheet') {
      if (isOpen) {
        setMounted(true);
        t.setValue(0); // reset offscreen
        animate(true);
      } else if (mounted) {
        animate(false);
      }
    } else {
      setMounted(isOpen);
    }
  }, [variant, isOpen, mounted, animate, t]);

  if (!mounted && !isOpen) return null;

  // translate along the active axis
  const translate = t.interpolate({
    inputRange: [0, 1],
    outputRange: [OFF, 0],
  });

  const transform: ViewStyle['transform'] =
    direction === 'right'
      ? [{ translateX: translate }]
      : [{ translateY: translate }];

  const dimOpacity = t.interpolate({
    inputRange: [0, 1],
    outputRange: [0, backdropOpacity],
  });

  return (
    <RNModal
      visible={mounted}
      transparent={variant === 'sheet'}
      animationType={variant === 'fullscreen' ? 'slide' : 'none'}
      statusBarTranslucent
      presentationStyle={variant === 'sheet' ? 'overFullScreen' : 'fullScreen'}
      onRequestClose={() =>
        variant === 'sheet' ? animate(false) : onClose?.()
      }
    >
      {variant === 'fullscreen' ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
          <ModalHeader onClose={() => onClose?.()} title={title} />
          {children}
        </SafeAreaView>
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              { opacity: dimOpacity },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              accessibilityHint="Dismisses the modal"
              style={StyleSheet.absoluteFill}
              onPress={() => animate(false)}
            />
          </Animated.View>

          {/* Panel host */}
          <View
            style={[
              styles.host,
              direction === 'right' ? { alignItems: 'flex-end' } : undefined,
              direction === 'up' && sheetTopPadding > 0
                ? { paddingTop: sheetTopPadding }
                : undefined,
            ]}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.cardPanel,
                direction === 'right' ? { marginLeft: panelOffset } : undefined,
                { transform },
                panelStyle,
              ]}
            >
              <SafeAreaView style={[styles.cardInner, contentStyle]}>
                {children}
              </SafeAreaView>
            </Animated.View>
          </View>
        </View>
      )}
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#000' },
  host: { flex: 1, justifyContent: 'flex-end' },
  cardPanel: {
    width: '100%',
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Android elevation
    ...Platform.select({ android: { elevation: 10 } }),
  },
  // default is compact; callers may pass { flex: 1 } to stretch
  cardInner: { flex: 0 },
});

export default BaseModal;
