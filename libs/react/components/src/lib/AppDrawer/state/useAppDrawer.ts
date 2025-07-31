import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { TAppDrawerAtomProps, appDrawerAtom } from './appDrawerAtom';

export function useAppDrawer() {
  const [_drawer, setDrawer] = useAtom(appDrawerAtom);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => (prev ? { ...prev, visible: false } : null));
  }, [setDrawer]);

  const showDrawer = useCallback(
    (props: Omit<TAppDrawerAtomProps, 'visible'>) => {
      setDrawer({ ...props, visible: true });
    },
    [setDrawer]
  );

  return {
    showDrawer,
    closeDrawer,
  };
}
