import { MouseEvent, PropsWithChildren } from 'react';

import { mergeCss } from '@monorepo/layout/styles/mergeCss';
import { useAtom } from 'jotai';
import { modalAtom } from '../atoms/modalAtom';

interface IProps extends PropsWithChildren {
  className?: string;
  closeOnMaskClick?: boolean;
}

export function ModalMask(props: IProps) {
  const { className, closeOnMaskClick = false, children } = props;

  // Temporary suppression to allow incremental cleanup without regressions.
  // ⚠️ If you're modifying this file, please remove this ignore and fix the issue.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_modal, setModal] = useAtom(modalAtom);

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

  function onMaskClick(e: MouseEvent<HTMLDivElement>) {
    if (e) {
      e.stopPropagation();
    }

    if (!closeOnMaskClick) {
      return;
    }

    setModal(null);
  }

  return (
    <div className={mergeCss(parentCss)} onClick={onMaskClick}>
      {children}
    </div>
  );
}
