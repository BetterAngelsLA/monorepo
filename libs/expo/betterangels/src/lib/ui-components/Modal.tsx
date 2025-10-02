import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Modal as RNModal,
  StyleSheet,
  View,
  useWindowDimensions,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IModalProps {
  isModalVisible: boolean;
  closeModal: () => void; // parent toggles visibility; we call after exit when user closes
  children: ReactNode;
  closeButton?: boolean;
  opacity?: number; // backdrop target opacity (0..1)
  vertical?: boolean; // true = slide up; false = slide from right
  ml?: number;
  mt?: number;
  height?: DimensionValue;
  fullWidth?: boolean;

  propagateSwipe?: boolean;
  onLayout?: () => void;
}

const DUR_IN = 260;
const DUR_OUT = 200;

export default function Modal({
  isModalVisible,
  closeModal,
  children,
  closeButton,
  opacity = 0.5,
  vertical = true,
  ml = 0,
  mt,
  height,
  fullWidth = true,
  propagateSwipe,
  onLayout,
}: IModalProps) {
  const enableSwipe = propagateSwipe === true;
  const insets = useSafeAreaInsets();
  const { width, height: screenH } = useWindowDimensions();

  // 0 = closed, 1 = open
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState<boolean>(isModalVisible);
  const prevVisible = useRef<boolean>(isModalVisible);

  const OFF = vertical ? screenH : width;

  // Derived animations from single driver
  const translate = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [OFF, 0],
      }),
    [progress, OFF]
  );

  const backdropOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, opacity],
      }),
    [progress, opacity]
  );

  const animateTo = useCallback(
    (to: 0 | 1, after?: () => void, dur = to ? DUR_IN : DUR_OUT) => {
      Animated.timing(progress, {
        toValue: to,
        duration: dur,
        easing: to ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && after?.());
    },
    [progress]
  );

  // Only animate on real visibility flips
  useEffect(() => {
    const was = prevVisible.current;
    const now = isModalVisible;
    prevVisible.current = now;

    if (now && !was) {
      setMounted(true);
      // reset to fully closed before opening
      progress.setValue(0);
      requestAnimationFrame(() => animateTo(1));
    } else if (!now && was) {
      // parent requested close: animate out, then unmount
      animateTo(0, () => setMounted(false));
    }
  }, [isModalVisible, animateTo, progress]);

  const requestClose = useCallback(() => {
    // user-initiated close: animate out first, then notify parent
    animateTo(0, () => {
      setMounted(false);
      closeModal?.();
    });
  }, [animateTo, closeModal]);

  // Swipe-to-close
  const panHandlers = useMemo(() => {
    if (!enableSwipe) return {};
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        vertical
          ? Math.abs(g.dy) > Math.abs(g.dx) && g.dy > 4
          : Math.abs(g.dx) > Math.abs(g.dy) && g.dx > 4,
      onPanResponderMove: (_, g) => {
        const delta = vertical ? g.dy : g.dx;
        if (delta > 0) {
          const clamped = Math.min(delta, OFF);
          const p = 1 - clamped / OFF; // 1..0 as you drag down/right
          progress.setValue(p);
        }
      },
      onPanResponderRelease: (_, g) => {
        const delta = vertical ? g.dy : g.dx;
        const vel = vertical ? g.vy : g.vx;
        const shouldClose = delta > OFF * 0.25 || vel > 0.8;
        animateTo(shouldClose ? 0 : 1);
        if (shouldClose) {
          // ensure parent state updates after exit
          setTimeout(() => requestClose(), DUR_OUT);
        }
      },
    }).panHandlers;
  }, [enableSwipe, vertical, OFF, progress, animateTo, requestClose]);

  const transform: ViewStyle['transform'] = useMemo(
    () =>
      vertical ? [{ translateY: translate }] : [{ translateX: translate }],
    [vertical, translate]
  );

  if (!mounted) return null;

  return (
    <RNModal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000', opacity: backdropOpacity },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          accessibilityHint="Closes the modal"
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Panel */}
      <View
        pointerEvents="box-none"
        style={[
          styles.root,
          { justifyContent: vertical ? 'flex-end' : 'flex-start' },
        ]}
      >
        <Animated.View
          {...panHandlers}
          onLayout={onLayout}
          style={[
            styles.panel,
            {
              transform,
              marginLeft: ml,
              marginTop: mt,
              backgroundColor: Colors.WHITE,
              borderTopLeftRadius: Radiuses.xs,
              borderTopRightRadius: Radiuses.xs,
              paddingBottom: 35 + insets.bottom,
              paddingTop: (fullWidth ? insets.top : 0) + Spacings.xs,
              alignSelf: vertical ? 'stretch' : 'flex-end',
              ...(fullWidth ? ({ flex: 1 } as const) : null),
              ...(height !== undefined ? { height } : null),
            } as ViewStyle,
          ]}
        >
          {enableSwipe && vertical && (
            <View
              style={{
                alignSelf: 'center',
                width: 54,
                height: 5,
                borderRadius: 4,
                backgroundColor: Colors.NEUTRAL_LIGHT,
                marginBottom: Spacings.sm,
              }}
            />
          )}

          {closeButton && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Closes the modal"
              onPress={requestClose}
              style={{ alignSelf: 'flex-end', marginRight: Spacings.md }}
            >
              <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
            </Pressable>
          )}

          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: {},
});
