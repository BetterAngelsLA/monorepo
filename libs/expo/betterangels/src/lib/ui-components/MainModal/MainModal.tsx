import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import React, {
  ElementType,
  Fragment,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  DimensionValue,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainModalActionBtn } from './MainModalActionBtn';
import { MainModalCloseBtn } from './MainModalCloseBtn';

export type TMainModalAction = {
  title: string;
  Icon: ElementType;
  route?: string;
  params?: Record<string, string>;
  onPress?: () => void;
};

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: (TMainModalAction | ReactNode)[];
  bottomSection?: ReactNode;
  topSection?: ReactNode;
  closeButton?: boolean;
  opacity?: number; // backdrop max opacity (0..1)
  vertical?: boolean; // true = bottom sheet; false = right drawer
  ml?: number; // left margin for right drawer
  height?: DimensionValue; // ✅ use DimensionValue here
}

const DURATION = 240;

export function MainModal(props: IMainModalProps) {
  const {
    isModalVisible,
    closeModal,
    actions,
    bottomSection,
    topSection,
    closeButton,
    opacity = 0.5,
    vertical = false,
    ml = 0,
    height = 'auto', // still fine: 'auto' is a valid DimensionValue
  } = props;

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(isModalVisible);
  const [sheetH, setSheetH] = useState(320);
  const [sheetW, setSheetW] = useState(320);

  useEffect(() => {
    if (isModalVisible) {
      setMounted(true);
      progress.stopAnimation();
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 0,
        duration: DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [isModalVisible, mounted, progress]);

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, Math.min(1, opacity))],
  });

  const translate = useMemo(
    () =>
      vertical
        ? {
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [sheetH, 0],
                }),
              },
            ],
          }
        : {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [sheetW, 0],
                }),
              },
            ],
          },
    [progress, vertical, sheetH, sheetW]
  );

  if (!mounted) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={closeModal}
    >
      {/* Backdrop */}
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

      {/* Sliding container */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          vertical ? styles.bottomContainer : styles.rightContainer,
          !vertical && ml ? { marginLeft: ml } : null,
          translate,
        ]}
        onLayout={(e) => {
          const { width, height: h } = e.nativeEvent.layout;
          if (vertical) {
            if (h && h !== sheetH) setSheetH(h);
          } else {
            if (width && width !== sheetW) setSheetW(width);
          }
        }}
      >
        <View
          style={[
            styles.panel,
            vertical
              ? {
                  borderTopLeftRadius: Radiuses.xs,
                  borderTopRightRadius: Radiuses.xs,
                  paddingTop: insets.top + Spacings.xs,
                  paddingBottom: 35 + insets.bottom,
                }
              : {
                  borderTopLeftRadius: Radiuses.xs,
                  borderBottomLeftRadius: Radiuses.xs,
                  paddingTop: insets.top + Spacings.md,
                  paddingBottom: insets.bottom + Spacings.md,
                },
            {
              height, // ✅ now correctly typed
              paddingHorizontal: Spacings.md,
              backgroundColor: Colors.WHITE,
            },
          ]}
        >
          {closeButton && <MainModalCloseBtn onPress={closeModal} />}

          <View style={styles.body}>
            {topSection}

            {actions.map((action, idx) => {
              if (React.isValidElement(action)) {
                return <Fragment key={idx}>{action}</Fragment>;
              }
              const { title, route, params, Icon, onPress } =
                action as TMainModalAction;
              return (
                <MainModalActionBtn
                  key={idx}
                  title={title}
                  Icon={Icon}
                  onPress={() => {
                    if (onPress) return onPress();
                    closeModal();
                    if (route) router.navigate({ pathname: route, params });
                  }}
                />
              );
            })}

            {bottomSection}
          </View>
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
  },
  panel: {
    backgroundColor: Colors.WHITE,
  },
  body: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: Spacings.xs,
  },
});
