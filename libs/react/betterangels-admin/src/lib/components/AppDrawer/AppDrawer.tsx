import { Sidebar, mergeCss } from '@monorepo/react/components';
import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { useAppDrawerState } from '../../state';
import { AppDrawerMask } from './AppDrawerMask';

const TRANSITION_DURATION = 300;

export interface IModal extends PropsWithChildren {
  className?: string;
  header?: string | ReactNode;
  parentCss?: string;
  closeCss?: string;
  onClose?: () => void;
}

export function AppDrawer(props: IModal): ReactElement | null {
  // const { className, onClose } = props;

  const [drawer] = useAppDrawerState();
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(!!drawer);
  const [placement, setPlacement] = useState<'left' | 'right'>('right');

  useEffect(() => {
    if (drawer) {
      setPlacement(drawer.placement ?? 'right');
      setShouldRender(true);
      requestAnimationFrame(() => setVisible(true));

      return;
    }

    setVisible(false);
    const timeout = setTimeout(() => setShouldRender(false), 300);

    return () => clearTimeout(timeout);
  }, [drawer]);

  if (!shouldRender) {
    return null;
  }

  return (
    <AppDrawerMask visible={visible}>
      <Sidebar
        defaultOpen={true}
        hideCloseBtn={true}
        placement={placement}
        className={mergeCss([
          visible ? 'animate-slideInLeft300' : 'animate-slideOutRight300',
        ])}
      >
        <Sidebar.Header>
          <h2 className="text-2xl truncate">HELLO</h2>
        </Sidebar.Header>
      </Sidebar>
    </AppDrawerMask>
  );
}
