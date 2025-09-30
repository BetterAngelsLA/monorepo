import { Colors } from '@monorepo/expo/shared/static';
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  Modal as RNModal,
  StyleSheet,
  View,
  ViewStyle,
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
  panelOffset?: number; // left margin for right drawer (like old `ml`)
  backdropOpacity?: number; // 0..1
  sheetTopPadding?: number; // NEW: top padding for 'up' sheets (to match original)

  /** Style overrides */
  panelStyle?: ViewStyle; // outer animated card container (size/radius/bg)
  contentStyle?: ViewStyle; // inner content container (padding, etc.)
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
  sheetTopPadding = 0, // default none
  panelStyle,
  contentStyle,
}: IFileViewerModal) {
  const screenH = useMemo(() => Dimensions.get('window').height, []);
  const screenW = useMemo(() => Dimensions.get('window').width, []);
  const [mounted, setMounted] = useState(isOpen);

  const closingRef = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;
  const dim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'sheet') {
      if (isOpen) {
        setMounted(true);
        closingRef.current = false;
        Animated.parallel([
          Animated.timing(progress, {
            toValue: 1,
            duration: OPEN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dim, {
            toValue: 1,
            duration: OPEN_MS - 60,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      } else if (mounted && !closingRef.current) {
        requestClose();
      }
    } else {
      setMounted(isOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, isOpen]);

  const requestClose = () => {
    if (variant === 'fullscreen') {
      onClose?.();
      setIsOpen?.(false);
      return;
    }
    if (!mounted || closingRef.current) return;

    closingRef.current = true;
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dim, {
        toValue: 0,
        duration: CLOSE_MS - 40,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      closingRef.current = false;
      onClose?.();
      setIsOpen?.(false);
    });
  };

  if (!mounted && !isOpen) return null;

  // Off-screen vectors
  const offX = direction === 'right' ? screenW : 0;
  const offY = direction === 'right' ? 0 : screenH;

  const panelAnim = {
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [offX, 0],
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [offY, 0],
        }),
      },
    ],
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
  };

  const backdropAnim = {
    opacity: dim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, backdropOpacity],
    }),
  };

  const hostAlign =
    direction === 'right' ? { alignItems: 'flex-end' as const } : null;
  const hostTopPad =
    direction === 'up' && sheetTopPadding > 0
      ? { paddingTop: sheetTopPadding }
      : null;

  return (
    <RNModal
      visible={mounted}
      transparent={variant === 'sheet'}
      animationType={variant === 'fullscreen' ? 'slide' : 'none'}
      statusBarTranslucent
      presentationStyle={variant === 'sheet' ? 'overFullScreen' : 'fullScreen'}
      onRequestClose={requestClose}
    >
      {variant === 'fullscreen' ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.WHITE }}>
          <ModalHeader onClose={requestClose} title={title} />
          {children}
        </SafeAreaView>
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnim]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              accessibilityHint="Dismisses the modal"
              style={StyleSheet.absoluteFill}
              onPress={requestClose}
            />
          </Animated.View>

          {/* Panel host */}
          <View
            style={[
              styles.host,
              hostAlign || undefined,
              hostTopPad || undefined,
            ]}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.cardPanel,
                direction === 'right' ? { marginLeft: panelOffset } : null,
                panelAnim,
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
