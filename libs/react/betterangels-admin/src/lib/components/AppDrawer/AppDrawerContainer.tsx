import { ReactElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDrawerState } from '../../state';
import { AppDrawer } from './AppDrawer';

type IProps = {
  className?: string;
};

export function AppDrawerContainer(props: IProps): ReactElement | null {
  const { className } = props;

  const location = useLocation();
  const [drawer, setDrawer] = useAppDrawerState();

  useEffect((): void => {
    setDrawer(null);
  }, [location.pathname]);

  return (
    <AppDrawer className={className} {...drawer}>
      {drawer?.content}
    </AppDrawer>
  );
}
