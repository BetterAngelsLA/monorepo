/**
 * BottomSheetLayoutProvider
 *
 * Coordinates the active container height used by the BottomSheet system.
 *
 * The provider tracks a stack of layout containers and updates
 * Gorhom BottomSheet's internal `containerLayoutState` whenever the
 * active container changes.
 *
 * The first container in the stack is the root layout, measured via
 * this provider's internal `onLayout` handler.
 *
 * Additional containers may register themselves via
 * `useBottomSheetContainerLayout`. When a container registers,
 * its height becomes the active BottomSheet container height.
 * When it unregisters (typically on component unmount), the
 * previous container becomes active again.
 *
 * This mechanism allows BottomSheets to render correctly in
 * environments where the available screen height differs from
 * the root layout, such as:
 *
 * - modal screens
 * - fullscreen overlays
 * - nested navigators
 * - custom layout containers
 *
 * The active container is always the most recently registered
 * container in the stack.
 *
 * The provider writes container height updates to
 * `containerLayoutState` using `requestAnimationFrame` to avoid
 * React Native Reanimated warnings about updating shared values
 * during render.
 */

import { useBottomSheetModalInternal } from '@gorhom/bottom-sheet';
import { ReactNode, useCallback, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { BottomSheetLayoutContext } from './BottomSheetLayoutContext';

type TProps = {
  children: ReactNode;
};

export function BottomSheetLayoutProvider(props: TProps) {
  const { children } = props;

  const { containerLayoutState } = useBottomSheetModalInternal();

  const containerStackRef = useRef<{ id: string; height: number }[]>([]);
  const rootId = 'root';

  const setContainerHeight = useCallback(
    (height: number) => {
      requestAnimationFrame(() => {
        containerLayoutState.value = {
          height,
          offset: { top: 0, bottom: 0, left: 0, right: 0 },
        };
      });
    },
    [containerLayoutState]
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height;

      const stack = containerStackRef.current;

      const index = stack.findIndex((x) => x.id === rootId);

      if (index === -1) {
        stack.push({ id: rootId, height });
      } else {
        stack[index].height = height;
      }

      const activeHeight = stack[stack.length - 1]?.height;

      if (activeHeight != null) {
        setContainerHeight(activeHeight);
      }
    },
    [setContainerHeight]
  );

  const registerContainer = useCallback(
    (id: string, height: number) => {
      const stack = containerStackRef.current;

      const index = stack.findIndex((x) => x.id === id);

      if (index === -1) {
        stack.push({ id, height });
      } else {
        stack[index].height = height;
      }

      const activeHeight = stack[stack.length - 1]?.height;

      if (activeHeight != null) {
        setContainerHeight(activeHeight);
      }
    },
    [setContainerHeight]
  );

  const unregisterContainer = useCallback(
    (id: string) => {
      const stack = containerStackRef.current;

      const index = stack.findIndex((x) => x.id === id);

      if (index !== -1) {
        stack.splice(index, 1);
      }

      const activeHeight = stack[stack.length - 1]?.height;

      if (activeHeight != null) {
        setContainerHeight(activeHeight);
      }
    },
    [setContainerHeight]
  );

  return (
    <BottomSheetLayoutContext.Provider
      value={{
        registerContainer,
        unregisterContainer,
      }}
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {children}
      </View>
    </BottomSheetLayoutContext.Provider>
  );
}
