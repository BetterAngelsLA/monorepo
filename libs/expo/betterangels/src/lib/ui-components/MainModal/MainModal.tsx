import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import {
  ElementType,
  Fragment,
  ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BaseModal } from '@monorepo/expo/shared/ui-components';
import { MainModalActionBtn } from './MainModalActionBtn';
import { MainModalCloseBtn } from './MainModalCloseBtn';

/** A margin past `BaseModal`'s 200ms out-animation, used as a navigation net. */
const NAVIGATION_FALLBACK_MS = 800;

export type TMainModalAction = {
  title: string | ReactNode;
  Icon: ElementType;
  route?: string;
  params?: Record<string, string>;
  testId?: string;
  onPress?: () => void;
};

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: (TMainModalAction | ReactNode)[];
  bottomSection?: ReactNode;
  topSection?: ReactNode;
  closeButton?: boolean;
  /** Backdrop opacity (0–1) */
  opacity?: number;
  /** When false, slide from right (drawer). When true, slide up (bottom sheet). */
  vertical?: boolean;
  /** Left margin for right-drawer partial width */
  ml?: number;
  /** Fixed height or 'auto' */
  height?: DimensionValue;
  /** Fired after the modal has fully closed (animation finished, unmounted). */
  onCloseComplete?: () => void;
}

export function MainModal({
  isModalVisible,
  closeModal,
  onCloseComplete,
  actions,
  bottomSection,
  topSection,
  closeButton,
  opacity = 0, // match original default
  vertical = false, // match original default
  ml = 0,
  height = 'auto',
}: IMainModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * Where an action is going, once the sheet has finished closing.
   *
   * Navigating *while* the sheet animates out crashes the native mounting layer
   * when the destination has a header: iOS segfaults inside Fabric's
   * `uiManagerDidFinishTransaction`. So the press closes and remembers, and the
   * navigation happens afterwards.
   */
  const pendingRoute = useRef<{
    route: string;
    params?: Record<string, string>;
  } | null>(null);

  /** The fallback below, kept so it can be cancelled rather than merely ignored. */
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallback = useCallback(() => {
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  }, []);

  // The sheet can be unmounted mid-animation; nothing should navigate then.
  useEffect(() => clearFallback, [clearFallback]);

  /**
   * Consumes the destination and navigates, so it can only happen once.
   *
   * `onCloseComplete` is not guaranteed: `BaseModal` calls its callback only
   * when the out-animation *finishes*, so an interrupted close would drop the
   * press silently. The press therefore also arms this as a fallback, a margin
   * beyond the 200ms animation.
   */
  const navigateToPending = useCallback(() => {
    clearFallback();

    const pending = pendingRoute.current;

    if (!pending) return;

    pendingRoute.current = null;
    router.navigate({ pathname: pending.route, params: pending.params });
  }, [router, clearFallback]);

  function closeAndGo(route: string, params?: Record<string, string>) {
    pendingRoute.current = { route, params };
    clearFallback();
    closeModal();

    fallbackTimer.current = setTimeout(
      navigateToPending,
      NAVIGATION_FALLBACK_MS,
    );
  }

  return (
    <BaseModal
      title={null}
      isOpen={isModalVisible}
      onClose={closeModal}
      onCloseComplete={() => {
        onCloseComplete?.();
        navigateToPending();
      }}
      variant="sheet"
      direction={vertical ? 'up' : 'right'}
      panelOffset={ml}
      backdropOpacity={opacity}
      panelStyle={{
        borderTopLeftRadius: Radiuses.xs,
        borderTopRightRadius: Radiuses.xs,
        backgroundColor: Colors.WHITE,
        height,
      }}
      contentStyle={{
        paddingTop: insets.top + Spacings.xs,
        paddingHorizontal: Spacings.md,
        paddingBottom: 35 + insets.bottom,
      }}
    >
      {closeButton && <MainModalCloseBtn onPress={closeModal} />}

      <View style={styles.modalOverlay}>
        {topSection}

        {actions.map((action, idx: number) => {
          if (isValidElement(action)) {
            return <Fragment key={idx}>{action}</Fragment>;
          }

          const { title, route, params, testId, Icon, onPress } =
            action as TMainModalAction;

          return (
            <MainModalActionBtn
              key={idx}
              title={title}
              testId={testId}
              Icon={Icon}
              onPress={() => {
                if (onPress) return onPress();

                if (route) {
                  closeAndGo(route, params);
                  return;
                }

                closeModal();
              }}
            />
          );
        })}

        {bottomSection}
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});

export default MainModal;
