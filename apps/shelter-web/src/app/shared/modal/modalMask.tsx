import { PropsWithChildren } from 'react';

import { useAtom } from 'jotai';
import { modalContentAtom } from '../atoms/modalContentAtom';
import { mergeCss } from '../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  closeOnMaskClick?: boolean;
}

export function ModalMask(props: IProps) {
  const { className, closeOnMaskClick = true, children } = props;

  const [_modal, setModal] = useAtom(modalContentAtom);

  const parentCss: string = [
    'top-0',
    'left-0',
    'right-0',
    'bottom-0',
    'fixed',
    'z-max',
    'flex',
    'justify-center',
    'items-center',
    'bg-gray-500/20 backdrop-blur',
    className,
  ].join(' ');

  function onMaskClick() {
    console.log('################################### ON MASK CLICK');
    if (closeOnMaskClick) {
      setModal(null);
    }
  }

  return (
    <div className={mergeCss(parentCss)} onClick={onMaskClick}>
      {children}
    </div>
  );
}
