import { RefObject, useCallback } from 'react';
import { Keyboard, ScrollView, View, findNodeHandle } from 'react-native';

export default function useScrollToScreenTop<T extends View>(
  parentScrollViewRef?: RefObject<ScrollView>
) {
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

      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          measureAndScroll();
          keyboardDidShowListener.remove();
        }
      );
    },
    [parentScrollViewRef]
  );

  return { scrollToTop };
}
