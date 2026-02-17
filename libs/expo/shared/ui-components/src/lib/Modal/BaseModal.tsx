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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ModalHeader } from './ModalHeader';

export interface IFileViewerModal extends PropsWithChildren {
  /** Header title. If null/undefined in fullscreen, we auto-render a safe-area overlay close. */
  title?: string | null;

  /** External visibility control (controlled component). */
  isOpen: boolean;

  /** Optional setter invoked on internal close (backdrop/overlay/hardware back). */
  setIsOpen?: (open: boolean) => void;

  /** Fired after an internal close finishes. Parent-driven closes should NOT rely on this. */
  onClose?: () => void;

  /** 'fullscreen' uses RN Modal animation; 'sheet' uses a custom slide + backdrop fade. */
  variant?: 'fullscreen' | 'sheet';

  /** Sheet options */
  direction?: 'up' | 'right'; // 'up' => bottom sheet; 'right' => side drawer
  panelOffset?: number; // left margin for 'right' drawer
  backdropOpacity?: number; // 0..1 (dim amount)
  sheetTopPadding?: number; // extra space at top for 'up' sheets

  /** Style overrides */
  panelStyle?: ViewStyle;
  contentStyle?: ViewStyle;

  /** Force overlay close in fullscreen (otherwise auto-enabled when title == null). */
  useOverlayClose?: boolean;
  overlayCloseColor?: string;

  /** Fired after the modal has fully closed (animation finished, unmounted). */
  onCloseComplete?: () => void;
}

const DUR_IN = 260;
const DUR_OUT = 200;

export function BaseModal({
  title,
  isOpen,
  setIsOpen,
  onClose,
  onCloseComplete,
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

  // --- SHEET animation state ---
  const [mounted, setMounted] = useState(isOpen); // only relevant for 'sheet'
  const progress = useRef(new Animated.Value(0)).current; // 0 -> closed, 1 -> open
  const OFF = direction === 'right' ? screenW : screenH;

  const animateTo = (to: 0 | 1, done?: () => void) => {
    Animated.timing(progress, {
      toValue: to,
      duration: to ? DUR_IN : DUR_OUT,
      easing: to ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && done?.());
  };

  // Mount/unmount for sheet; fullscreen relies on RNModal visibility.
  useEffect(() => {
    if (variant !== 'sheet') {
      setMounted(isOpen);
      return;
    }
    if (isOpen) {
      if (!mounted) setMounted(true);
      progress.setValue(0);
      // Kick off open animation on next frame to avoid layout thrash.
      requestAnimationFrame(() => animateTo(1));
    } else if (mounted) {
      // Parent-driven close: animate out; do not call onClose to avoid double-callbacks.
      animateTo(0, () => {
        setMounted(false);
        onCloseComplete?.();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, isOpen]);

  // Auto overlay for fullscreen w/o title (full-bleed viewers)
  const shouldOverlayClose =
    useOverlayClose ?? (variant === 'fullscreen' && title == null);

  // Sheet transforms
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

  const internalSheetClose = () => {
    animateTo(0, () => {
      setMounted(false);
      setIsOpen?.(false);
      onClose?.();
      onCloseComplete?.();
    });
  };

  const internalFullscreenClose = () => {
    setIsOpen?.(false);
    onClose?.();
  };

  // Early out for sheet when not mounted
  if (variant === 'sheet' && !mounted && !isOpen) return null;

  return (
    <RNModal
      visible={variant === 'sheet' ? mounted : isOpen}
      transparent={variant === 'sheet'}
      animationType={variant === 'fullscreen' ? 'slide' : 'none'}
      statusBarTranslucent={variant === 'sheet'} // sheets draw under the status bar; fullscreen uses SafeArea
      presentationStyle={variant === 'sheet' ? 'overFullScreen' : 'fullScreen'}
      onRequestClose={() => {
        if (variant === 'sheet') internalSheetClose();
        else internalFullscreenClose();
      }}
    >
      {/* Always provide safe-area context inside RNModal to avoid stale/missing insets on reopen */}
      <SafeAreaProvider>
        {variant === 'fullscreen' ? (
          shouldOverlayClose ? (
            // Fullscreen content (no header). Keep ALL edges safe so PDF/WebViews won't overlap bars.
            <View style={styles.flexWhite}>
              <SafeAreaView
                edges={['top', 'left', 'right', 'bottom']}
                style={styles.flex}
              >
                {children}
              </SafeAreaView>

              {/* Safe-area overlay close (below notch, above content) */}
              <SafeAreaView
                pointerEvents="box-none"
                edges={['top', 'right']}
                style={StyleSheet.absoluteFill}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  accessibilityHint="Closes the modal"
                  onPress={internalFullscreenClose}
                  style={styles.overlayClose}
                >
                  <PlusIcon
                    rotate="45deg"
                    size="lg"
                    color={overlayCloseColor}
                  />
                </Pressable>
              </SafeAreaView>
            </View>
          ) : (
            // Fullscreen with header (content below the notch)
            <SafeAreaView
              edges={['top', 'left', 'right', 'bottom']}
              style={styles.flexWhite}
            >
              {title != null && (
                <ModalHeader onClose={internalFullscreenClose} title={title} />
              )}
              {children}
            </SafeAreaView>
          )
        ) : (
          // --- SHEET ---
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
                onPress={internalSheetClose}
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
                  direction === 'right'
                    ? { marginLeft: panelOffset }
                    : undefined,
                  { transform },
                  panelStyle,
                ]}
              >
                {/* For a bottom sheet, pad left/right/bottom only */}
                <SafeAreaView
                  edges={['left', 'right', 'bottom']}
                  style={[styles.cardInner, contentStyle]}
                >
                  {children}
                </SafeAreaView>
              </Animated.View>
            </View>
          </View>
        )}
      </SafeAreaProvider>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexWhite: { flex: 1, backgroundColor: Colors.WHITE },

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

  overlayClose: {
    position: 'absolute',
    top: 0, // SafeAreaView adds inset for us
    right: 0,
    padding: 8,
    marginTop: 8,
    marginRight: 12,
    zIndex: 10,
  },
});

export default BaseModal;
