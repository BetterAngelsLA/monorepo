import { useAtom } from 'jotai';
import { ReactElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Drawer } from './Drawer';
import { appDrawerAtom } from './state/appDrawerAtom';

type IProps = {
  className?: string;
};

export function AppDrawer(props: IProps): ReactElement | null {
  const { className } = props;

  const location = useLocation();
  const [drawer, setDrawer] = useAtom(appDrawerAtom);

  // destroy Drawer if change page
  useEffect((): void => {
    setDrawer(null);
  }, [location.pathname]);

  return (
    <Drawer className={className} {...drawer}>
      {drawer?.content}
    </Drawer>
  );
}
