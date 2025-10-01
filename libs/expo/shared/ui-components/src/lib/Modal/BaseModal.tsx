// libs/expo/shared/ui-components/src/lib/Modal/BaseModal.tsx
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';
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
  /** Header title; if null/undefined in fullscreen, we auto-render a safe-area overlay close */
  title?: string | null;

  /** External visibility */
  isOpen: boolean;

  /** Optional: parent setter (used when the modal initiates a close) */
  setIsOpen?: (open: boolean) => void;

  /** Called after an internal close (backdrop/overlay/hardware back in sheet/fullscreen) */
  onClose?: () => void;

  /** 'fullscreen' uses RN modal animation; 'sheet' is our slide+fade with backdrop */
  variant?: 'fullscreen' | 'sheet';

  /** Sheet options */
  direction?: 'up' | 'right'; // 'up' => bottom sheet, 'right' => drawer
  panelOffset?: number; // drawer left margin
  backdropOpacity?: number; // 0..1
  sheetTopPadding?: number; // extra top padding for 'up' sheets

  /** Style overrides */
  panelStyle?: ViewStyle;
  contentStyle?: ViewStyle;

  /** Force overlay close in fullscreen (otherwise auto-enabled when title == null) */
  useOverlayClose?: boolean;
  overlayCloseColor?: string;
}

const DUR_IN = 260;
const DUR_OUT = 200;

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
  useOverlayClose,
  overlayCloseColor = Colors.BLACK,
}: IFileViewerModal) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // ---- SHEET ANIMATION STATE ----
  const [mounted, setMounted] = useState(isOpen); // only relevant for 'sheet'
  const progress = useRef(new Animated.Value(0)).current; // 0 closed -> 1 open
  const OFF = direction === 'right' ? screenW : screenH;

  const animateTo = (to: 0 | 1, after?: () => void) => {
    Animated.timing(progress, {
      toValue: to,
      duration: to ? DUR_IN : DUR_OUT,
      easing: to ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && after?.());
  };

  // Mount/unmount for sheet; fullscreen relies on RN Modal visibility
  useEffect(() => {
    if (variant !== 'sheet') {
      setMounted(isOpen);
      return;
    }
    if (isOpen) {
      if (!mounted) setMounted(true);
      progress.setValue(0);
      requestAnimationFrame(() => animateTo(1));
    } else if (mounted) {
      animateTo(0, () => setMounted(false)); // parent-driven close: don't call onClose to avoid double-callbacks
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, isOpen]); // simple & stable

  // Auto overlay for fullscreen with no title (full-bleed viewers)
  const shouldOverlayClose =
    useOverlayClose ?? (variant === 'fullscreen' && title == null);

  // Build a SafeArea overlay "X" that always sits below the notch/status bar.
  // Using SafeAreaView avoids brittle insets math and works reliably inside RN Modal windows.
  const overlayClose = shouldOverlayClose ? (
    <SafeAreaView
      pointerEvents="box-none"
      edges={['top', 'right']}
      style={StyleSheet.absoluteFill}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        accessibilityHint="Closes the modal"
        onPress={() => {
          setIsOpen?.(false);
          onClose?.();
        }}
        style={{
          position: 'absolute',
          top: 0, // SafeAreaView provides the top inset
          right: 0,
          padding: 8,
          marginTop: 8,
          marginRight: 12,
          zIndex: 10,
        }}
      >
        <PlusIcon rotate="45deg" size="lg" color={overlayCloseColor} />
      </Pressable>
    </SafeAreaView>
  ) : null;

  // If sheet not mounted and not open, render nothing
  if (variant === 'sheet' && !mounted && !isOpen) return null;

  // Derived sheet transforms
  const translate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [OFF, 0],
  });
  const transform: ViewStyle['transform'] =
    direction === 'right'
      ? [{ translateX: translate }]
      : [{ translateY: translate }];
  const dimOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, backdropOpacity],
  });

  // Internal close for SHEET (animate out, then notify)
  const requestSheetClose = () => {
    animateTo(0, () => {
      setMounted(false);
      setIsOpen?.(false);
      onClose?.();
    });
  };

  return (
    <RNModal
      visible={variant === 'sheet' ? mounted : isOpen}
      transparent={variant === 'sheet'}
      animationType={variant === 'fullscreen' ? 'slide' : 'none'}
      statusBarTranslucent={variant === 'sheet'} // sheets draw under status bar; fullscreen uses SafeArea
      presentationStyle={variant === 'sheet' ? 'overFullScreen' : 'fullScreen'}
      onRequestClose={() => {
        if (variant === 'sheet') {
          requestSheetClose();
        } else {
          setIsOpen?.(false);
          onClose?.();
        }
      }}
    >
      {variant === 'fullscreen' ? (
        shouldOverlayClose ? (
          // Full-bleed content; overlay "X" respects safe area
          <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
            {children}
            {overlayClose}
          </View>
        ) : (
          // Header mode: always below notch
          <SafeAreaView
            edges={['top', 'left', 'right', 'bottom']}
            style={{ flex: 1, backgroundColor: Colors.WHITE }}
          >
            {title != null && (
              <ModalHeader onClose={() => onClose?.()} title={title} />
            )}
            {children}
          </SafeAreaView>
        )
      ) : (
        // ---- SHEET ----
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
              onPress={requestSheetClose}
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
  // callers can pass { flex: 1 } via contentStyle to stretch
  cardInner: { flex: 0 },
});

export default BaseModal;
