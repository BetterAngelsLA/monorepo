import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Modal as RNModal,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DimensionVal = number | string;

interface IModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  children: ReactNode;
  closeButton?: boolean;
  opacity?: number;
  vertical?: boolean; // true = bottom sheet; false = slide from right
  ml?: number;
  mt?: number;
  height?: DimensionVal;
  propogateSwipe?: boolean;
  onLayout?: () => void;
  fullWidth?: boolean;
}

export default function Modal({
  isModalVisible,
  closeModal,
  children,
  closeButton,
  opacity = 0,
  vertical = false,
  ml = 0,
  mt,
  height,
  propogateSwipe = false,
  onLayout,
  fullWidth = true,
}: IModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height: screenH } = useWindowDimensions();

  const translate = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const OFF = vertical ? screenH : width;
  const DUR_IN = 260,
    DUR_OUT = 200;

  const animate = (toOpen: boolean) => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: toOpen ? 0 : OFF,
        duration: toOpen ? DUR_IN : DUR_OUT,
        easing: toOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: toOpen ? opacity : 0,
        duration: toOpen ? DUR_IN - 60 : DUR_OUT - 20,
        easing: toOpen ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!toOpen) closeModal();
    });
  };

  useEffect(() => {
    if (isModalVisible) {
      // start offscreen on show
      translate.setValue(OFF);
      backdrop.setValue(0);
      animate(true);
    } else {
      animate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalVisible, OFF, opacity, vertical]);

  const panHandlers = useMemo(() => {
    if (!propogateSwipe) return {};
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        vertical
          ? Math.abs(g.dy) > Math.abs(g.dx) && g.dy > 4
          : Math.abs(g.dx) > Math.abs(g.dy) && g.dx > 4,
      onPanResponderMove: (_, g) => {
        const delta = vertical ? g.dy : g.dx;
        if (delta > 0) {
          const clamped = Math.min(delta, OFF);
          translate.setValue(clamped);
          const progress = 1 - Math.min(clamped / OFF, 1);
          backdrop.setValue(opacity * progress);
        }
      },
      onPanResponderRelease: (_, g) => {
        const delta = vertical ? g.dy : g.dx;
        const shouldClose =
          delta > OFF * 0.25 || (vertical ? g.vy : g.vx) > 0.8;
        shouldClose ? animate(false) : animate(true);
      },
    }).panHandlers;
  }, [propogateSwipe, vertical, OFF, opacity, animate, translate, backdrop]);

  const transform = vertical
    ? [{ translateY: translate }]
    : [{ translateX: translate }];

  return (
    <RNModal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={() => animate(false)}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000', opacity: backdrop },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => animate(false)}
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
              paddingTop: fullWidth ? insets.top + Spacings.xs : Spacings.xs,
              ...(fullWidth ? { flex: 1 } : null),
              ...(height != null ? { height } : null),
              alignSelf: vertical ? 'stretch' : 'flex-end',
            },
          ]}
        >
          {propogateSwipe && vertical && (
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
              style={{ alignSelf: 'flex-end', marginRight: Spacings.md }}
              accessibilityLabel="close"
              accessibilityHint="closes the modal"
              accessibilityRole="button"
              onPress={() => animate(false)}
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
