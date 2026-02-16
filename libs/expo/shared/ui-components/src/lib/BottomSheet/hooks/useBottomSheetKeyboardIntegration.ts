import { useBottomSheetInternal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect } from 'react';
import { findNodeHandle } from 'react-native';

export function useBottomSheetKeyboardIntegration(
  ref: React.RefObject<any>,
  enabled?: boolean
) {
  if (!enabled) {
    return {
      handleOnFocus: undefined,
      handleOnBlur: undefined,
    };
  }

  const { animatedKeyboardState, textInputNodesRef } = useBottomSheetInternal();

  const handleOnFocus = useCallback(
    (e: any) => {
      animatedKeyboardState.set((state) => ({
        ...state,
        target: e.nativeEvent.target,
      }));
    },
    [animatedKeyboardState]
  );

  const handleOnBlur = useCallback(
    (e: any) => {
      const keyboardState = animatedKeyboardState.get();
      const nodeHandle = findNodeHandle(ref.current);

      if (keyboardState.target === nodeHandle) {
        animatedKeyboardState.set((state) => ({
          ...state,
          target: undefined,
        }));
      }
    },
    [animatedKeyboardState, ref]
  );

  useEffect(() => {
    const nodeHandle = findNodeHandle(ref.current);
    if (!nodeHandle) return;

    textInputNodesRef.current.add(nodeHandle);

    return () => {
      textInputNodesRef.current.delete(nodeHandle);
    };
  }, [ref, textInputNodesRef]);

  return { handleOnFocus, handleOnBlur };
}
