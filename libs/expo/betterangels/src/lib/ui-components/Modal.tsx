import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DimensionValue,
  GestureResponderEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  closeButton?: boolean;
  opacity?: number; // backdrop max opacity (0..1)
  vertical?: boolean; // true = bottom sheet, false = right drawer
  ml?: number; // margin-left gap for right drawer
  height?: DimensionValue;
  children: ReactNode;
  mt?: number;
  propogateSwipe?: boolean; // enable swipe-to-dismiss on same axis
  onLayout?: () => void; // called when panel layout happens
  fullWidth?: boolean; // if true, panel flexes to fill available space
}

const DURATION = 220;
const SWIPE_CLOSE_THRESHOLD = 80; // px

export default function AppModal({
  isModalVisible,
  closeModal,
  children,
  closeButton,
  opacity = 0.5,
  vertical = false,
  ml = 0,
  height = 'auto',
  mt,
  propogateSwipe = false,
  onLayout,
  fullWidth = true,
}: IModalProps) {
  const insets = useSafeAreaInsets();

  // Mount to allow custom in/out animation before unmounting
  const [mounted, setMounted] = useState(isModalVisible);

  // Progress drives backdrop opacity and panel slide
  const progress = useRef(new Animated.Value(0)).current;

  // Drag value for swipe-to-dismiss (0 at rest; positive when swiping down/right)
  const drag = useRef(new Animated.Value(0)).current;

  // Measured panel size for correct off-screen start
  const [panelH, setPanelH] = useState(320);
  const [panelW, setPanelW] = useState(320);

  // Animate in/out on visibility changes
  useEffect(() => {
    if (isModalVisible) {
      setMounted(true);
      progress.stopAnimation();
      progress.setValue(0);
      drag.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      // Animate out, then unmount
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 0,
        duration: DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
        drag.setValue(0);
      });
    }
  }, [isModalVisible, mounted, progress, drag]);

  // Backdrop opacity
  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, Math.min(1, opacity))],
  });

  // Base translate from progress (off-screen -> on-screen)
  const baseTranslate = useMemo(() => {
    return vertical
      ? progress.interpolate({ inputRange: [0, 1], outputRange: [panelH, 0] })
      : progress.interpolate({ inputRange: [0, 1], outputRange: [panelW, 0] });
  }, [progress, vertical, panelH, panelW]);

  // Combine base progress + live drag
  const transformStyle = vertical
    ? { transform: [{ translateY: Animated.add(baseTranslate, drag) }] }
    : { transform: [{ translateX: Animated.add(baseTranslate, drag) }] };

  // PanResponder for swipe-to-dismiss (typed, no `any`)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (
        _evt: GestureResponderEvent,
        g: PanResponderGestureState
      ) => {
        if (!propogateSwipe) return false;
        if (vertical)
          return Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx);
        return Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy);
      },
      onPanResponderMove: (
        _evt: GestureResponderEvent,
        g: PanResponderGestureState
      ) => {
        const distance = vertical ? g.dy : g.dx;
        // Only allow positive drag (down/right) to close. Clamp negatives to 0.
        drag.setValue(distance > 0 ? distance : 0);
      },
      onPanResponderRelease: (
        _evt: GestureResponderEvent,
        g: PanResponderGestureState
      ) => {
        const distance = vertical ? g.dy : g.dx;
        if (distance > SWIPE_CLOSE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(progress, {
              toValue: 0,
              duration: DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(drag, {
              toValue: vertical ? panelH : panelW,
              duration: DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => {
            drag.setValue(0);
            closeModal();
          });
        } else {
          Animated.spring(drag, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!mounted) return null;

  return (
    <Modal
      transparent
      animationType="none" // we animate ourselves
      visible={mounted}
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={closeModal}
    >
      {/* Backdrop (tap to close) */}
      <Pressable
        accessibilityRole="button"
        onPress={closeModal}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000', opacity: backdropOpacity },
          ]}
        />
      </Pressable>

      {/* Sliding panel container */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          vertical ? styles.bottomContainer : styles.rightContainer,
          !vertical && ml ? { marginLeft: ml } : null,
          transformStyle,
        ]}
        // Measure panel size for correct offscreen slide distance
        onLayout={(e) => {
          onLayout?.();
          const { width, height: h } = e.nativeEvent.layout;
          if (vertical) {
            if (h && h !== panelH) setPanelH(h);
          } else {
            if (width && width !== panelW) setPanelW(width);
          }
        }}
        {...(propogateSwipe ? panResponder.panHandlers : {})}
      >
        <View
          style={[
            styles.panel,
            vertical
              ? {
                  borderTopLeftRadius: Radiuses.xs,
                  borderTopRightRadius: Radiuses.xs,
                  paddingTop: (fullWidth ? insets.top : 0) + Spacings.xs,
                  paddingBottom: 35 + insets.bottom,
                }
              : {
                  borderTopLeftRadius: Radiuses.xs,
                  borderBottomLeftRadius: Radiuses.xs,
                  paddingTop: Spacings.md + insets.top,
                  paddingBottom: Spacings.md + insets.bottom,
                },
            {
              height,
              marginTop: mt,
              backgroundColor: Colors.WHITE,
              paddingHorizontal: Spacings.md,
              flex: fullWidth ? 1 : undefined,
            },
          ]}
        >
          {propogateSwipe && vertical && <View style={styles.grabber} />}

          {closeButton && (
            <Pressable
              style={{ marginLeft: 'auto', marginRight: Spacings.md }}
              accessible
              accessibilityHint="closes the modal"
              accessibilityRole="button"
              accessibilityLabel="close"
              onPress={closeModal}
            >
              <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
            </Pressable>
          )}

          {children}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  rightContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    // width is intrinsic to content; `ml` creates a left gap
  },
  panel: {
    backgroundColor: Colors.WHITE,
  },
  grabber: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: 4,
    backgroundColor: Colors.NEUTRAL_LIGHT,
    marginBottom: Spacings.sm,
  },
});
