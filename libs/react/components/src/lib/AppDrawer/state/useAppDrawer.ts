import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { TAppDrawerProps } from '../types';
import { appDrawerAtom } from './appDrawerAtom';

export function useAppDrawer() {
  const [_drawer, setDrawer] = useAtom(appDrawerAtom);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => (prev ? { ...prev, visible: false } : null));
  }, [setDrawer]);

  const showDrawer = useCallback(
    (props: Omit<TAppDrawerProps, 'visible'>) => {
      setDrawer({ ...props, visible: true });
    },
    [setDrawer]
  );

  return {
    showDrawer,
    closeDrawer,
  };
}
