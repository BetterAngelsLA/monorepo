import { MouseEvent, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

import { mergeCss } from '@monorepo/react/shared';

interface IProps extends PropsWithChildren {
  className?: string;
  closeOnMaskClick?: boolean;
  onClose: () => void;
}

export function ModalMask(props: IProps) {
  const { className, closeOnMaskClick = false, onClose, children } = props;

  const parentCss: string = [
    'top-0',
    'left-0',
    'right-0',
    'bottom-0',
    'fixed',
    'z-300',
    'flex',
    'justify-center',
    'items-center',
    'bg-gray-500/20 backdrop-blur-sm',
    className,
  ].join(' ');

  function onMaskClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();

    if (!closeOnMaskClick) {
      return;
    }

    onClose();
  }

  return createPortal(
    <div className={mergeCss(parentCss)} onClick={onMaskClick}>
      {children}
    </div>,
    document.body
  );
}
