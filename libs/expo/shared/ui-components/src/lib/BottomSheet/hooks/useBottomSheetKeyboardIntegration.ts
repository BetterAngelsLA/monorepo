import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { RefObject, useCallback, useEffect } from 'react';
import { findNodeHandle } from 'react-native';

type TNativeHandle = number | React.Component<unknown, unknown> | null;

type FocusEvent = {
  nativeEvent: {
    target: number;
  };
};

export function useBottomSheetKeyboardIntegration<T extends TNativeHandle>(
  ref: RefObject<T>
) {
  const { animatedKeyboardState, textInputNodesRef } = useBottomSheetInternal();

  const handleOnFocus = useCallback(
    (event: FocusEvent) => {
      animatedKeyboardState.set((state) => {
        return {
          ...state,
          target: event.nativeEvent.target,
        };
      });
    },
    [animatedKeyboardState]
  );

  const handleOnBlur = useCallback(() => {
    const keyboardState = animatedKeyboardState.get();
    const currentRef = ref.current;

    if (currentRef == null) {
      return;
    }

    const nodeHandle = findNodeHandle(currentRef);

    if (keyboardState.target !== nodeHandle) {
      return;
    }

    animatedKeyboardState.set((state) => {
      return {
        ...state,
        target: undefined,
      };
    });
  }, [animatedKeyboardState, ref]);

  useEffect(() => {
    const currentRef = ref.current;

    if (currentRef == null) {
      return;
    }

    const nodeHandle = findNodeHandle(currentRef);

    if (!nodeHandle) {
      return;
    }

    textInputNodesRef.current.add(nodeHandle);

    return () => {
      textInputNodesRef.current.delete(nodeHandle);
    };
  }, [ref, textInputNodesRef]);

  return { handleOnFocus, handleOnBlur };
}
