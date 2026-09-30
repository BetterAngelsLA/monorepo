import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { sortDirectionState } from './sortDirectionState';

export function useSortDirection() {
  const [direction, setDirection] = useAtom(sortDirectionState);

  const toggle = useCallback(() => {
    setDirection((previous) =>
      previous === 'newestFirst' ? 'oldestFirst' : 'newestFirst',
    );
  }, [setDirection]);

  return { direction, toggle };
}
