import { CloseIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { ModalMask } from './ModalMask';

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
  onClose: () => void;
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

  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Lock body scroll while the modal is mounted
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  // Auto-focus the modal container for keyboard accessibility
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  const modalCss = [
    'z-modal',
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
    <ModalMask closeOnMaskClick={closeOnMaskClick} onClose={handleClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={mergeCss(modalCss)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={mergeCss(modalBodyCss)}>
          <div className={mergeCss(headerCss)}>
            <button
              className={mergeCss(closeCss)}
              onClick={handleClose}
              aria-label="Close dialog"
            >
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
