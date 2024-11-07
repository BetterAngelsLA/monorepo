import { RefObject, useCallback, useEffect, useRef } from 'react';
import { Keyboard, ScrollView, View, findNodeHandle } from 'react-native';

type TListener = { remove: () => void };

export default function useScrollToScreenTop<T extends View>(
  parentScrollViewRef?: RefObject<ScrollView>
) {
  const keyboardDidShowListenerRef = useRef<TListener | null>(null);

  const scrollToTop = useCallback(
    (fieldRef: RefObject<T>) => {
      const parentScrollView = parentScrollViewRef?.current;
      const field = fieldRef?.current;

      if (!parentScrollView || !field) {
        return;
      }

      const scrollViewHandle = findNodeHandle(parentScrollView);

      if (!scrollViewHandle) {
        return;
      }

      const scrollToY = (x: number, y: number) => {
        parentScrollView.scrollTo({
          x: 0,
          y,
          animated: true,
        });
      };

      const measureAndScroll = () => {
        try {
          field.measureLayout(scrollViewHandle, scrollToY);
        } catch (e) {
          console.error(`useScrollToScreenTop error: [${e}].`);
        }
      };

      measureAndScroll();

      keyboardDidShowListenerRef.current?.remove();

      keyboardDidShowListenerRef.current = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          measureAndScroll();
          keyboardDidShowListenerRef.current?.remove();
          keyboardDidShowListenerRef.current = null;
        }
      );
    },
    [parentScrollViewRef]
  );

  useEffect(() => {
    return () => {
      keyboardDidShowListenerRef.current?.remove();
    };
  }, [parentScrollViewRef]);

  return { scrollToTop };
}
