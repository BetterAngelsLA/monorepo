import { CloseIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { modalAtom } from '../atoms/modalAtom';
import { mergeCss } from '../utils/styles/mergeCss';
import { ModalMask } from './modalMask';

export enum ModalAnimationEnum {
  SLIDE_UP = 'animate-slideInUp',
  EXPAND = 'animate-expandInOut',
}

export type TModalType = 'drawer' | 'fullscreen' | 'default';

export interface IModal extends PropsWithChildren {
  className?: string;
  header?: string | ReactNode;
  animation?: ModalAnimationEnum | null;
  type?: TModalType;
  fullW?: boolean;
  closeOnMaskClick?: boolean;
  footer?: ReactNode;
  onClose?: () => void;
}

export function Modal(props: IModal): ReactElement | null {
  const {
    className = '',
    animation = ModalAnimationEnum.SLIDE_UP,
    type = 'default',
    closeOnMaskClick,
    fullW,
    children,
    footer,
    onClose,
  } = props;

  // Temporary suppression to allow incremental cleanup without regressions.
  // ⚠️ If you're modifying this file, please remove this ignore and fix the issue.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_modal, setModal] = useAtom(modalAtom);

  function onModalClose(): void {
    if (typeof onClose === 'function') {
      onClose();
    }

    setModal(null);
  }

  const modalCss = [
    'z-max',
    'transform-gpu',
    'overflow-x-hidden',
    'overflow-y-auto',
    'bg-white',
    'flex',
    'flex-col',
    type === 'fullscreen' ? 'absolute top-0 left-0 right-0 bottom-0' : '',
    type === 'default' ? 'relative rounded-xl w-10/12' : '',
    animation === null ? 'animate-none' : animation,
    fullW ? 'w-full' : '',
    className,
  ];

  const modalBodyCss = [
    'md:pt-8',
    'p-6',
    'md:p-10',
    'max-h-[calc(100vh - 88)]',
    'overflow-hidden',
    'overflow-y-auto',
  ];

  const closeCss = ['ml-auto'];

  const headerCss = ['flex', 'justify-between', 'align-center', 'mt-0', 'mb-4'];

  const modalFooterCss = [
    'w-full',
    'mt-auto',
    'shadow-[0_-2px_4px_0px_rgba(0,0,0,0.05)]',
  ];

  return (
    <ModalMask closeOnMaskClick={closeOnMaskClick}>
      <div
        className={mergeCss(modalCss)}
        onClick={(e) => e && e.stopPropagation()}
      >
        <div className={mergeCss(modalBodyCss)}>
          <div className={mergeCss(headerCss)}>
            <button className={mergeCss(closeCss)} onClick={onModalClose}>
              <CloseIcon className="w-4" />
            </button>
          </div>
          <div className="w-full h-full">{children}</div>
        </div>

        {footer && <div className={mergeCss(modalFooterCss)}>{footer}</div>}
      </div>
    </ModalMask>
  );
}
