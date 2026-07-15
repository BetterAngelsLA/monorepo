import { useCallback, useRef, useState } from 'react';

type TUseKeyboardListNavOptions<T> = {
  items: T[];
  onSelect: (item: T) => void;
};

type TUseKeyboardListNavReturn = {
  activeIndex: number;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  reset: () => void;
};

/**
 * Generic hook for arrow-key navigation through a list,
 * with Enter to select the active item.
 *
 * - ArrowDown / ArrowUp wraps around at edges.
 * - Enter fires `onSelect` for the active item.
 * - Call `reset()` to reset the index back to -1.
 * - `onSelect` is read from a ref so inline callbacks don't
 *   cause unnecessary re-creations of `handleKeyDown`.
 */
export function useKeyboardListNav<T>(
  options: TUseKeyboardListNavOptions<T>,
): TUseKeyboardListNavReturn {
  const { items } = options;

  const onSelectRef = useRef(options.onSelect);
  onSelectRef.current = options.onSelect;

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;

        case 'Enter':
          if (activeIndex >= 0) {
            e.preventDefault();
            onSelectRef.current(items[activeIndex]);
          }
          break;
      }
    },
    [items, activeIndex],
  );

  const reset = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  return { activeIndex, handleKeyDown, reset };
}
