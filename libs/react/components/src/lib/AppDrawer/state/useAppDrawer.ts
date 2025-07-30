import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { TAppDrawerAtomProps, appDrawerAtom } from './appDrawerAtom';

export function useAppDrawer() {
  const [_drawer, setDrawer] = useAtom(appDrawerAtom);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
  }, [setDrawer]);

  const showDrawer = useCallback(
    (props: TAppDrawerAtomProps) => {
      const { content, placement, onClose } = props;

      setDrawer({
        content,
        placement,
        onClose,
      });
    },
    [setDrawer]
  );

  return {
    showDrawer,
    closeDrawer,
  };
}
