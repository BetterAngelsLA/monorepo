import { mergeCss } from '@monorepo/react/shared';
import { X } from 'lucide-react';
import { MouseEvent, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type TModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: TModalSize;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
  children: ReactNode;
  className?: string;
  contentClassname?: string;
}

const sizeClasses: Record<TModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'w-full h-full max-w-none max-h-none rounded-none',
};

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  showCloseButton = false,
  closeButtonClassName,
  className,
  contentClassname,
  children,
}: IModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.showModal();
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    function handleCancel(e: Event) {
      e.preventDefault();

      onClose();
    }

    dialog.addEventListener('cancel', handleCancel);

    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    const dialogBounds = dialogRef.current?.getBoundingClientRect();

    if (!dialogBounds) {
      return;
    }

    const { clientX, clientY } = e;

    const clickedOutsideDialog =
      clientX < dialogBounds.left ||
      clientX > dialogBounds.right ||
      clientY < dialogBounds.top ||
      clientY > dialogBounds.bottom;

    if (clickedOutsideDialog) {
      onClose();
    }
  }

  const backdropCss = ['backdrop:bg-black/50'];

  const dialogCss = [
    'bg-white',
    'rounded-2xl',
    'shadow-xl',
    'p-0',
    'm-auto',
    'w-full',
    'max-h-[85vh]',
    'flex',
    'flex-col',
    sizeClasses[size],
    className,
    contentClassname,
  ];

  const closeBtnCss = [
    'absolute',
    'top-4',
    'right-4',
    'z-10',
    'p-2',
    'rounded-full',
    'text-white/60',
    'hover:text-white',
    'bg-black/40',
    'hover:bg-black/80',
    'outline-none',
    'border-2',
    'border-white/50',
    'hover:border-white/80',
    'transition-colors',
    'cursor-pointer',
    closeButtonClassName,
  ];

  return createPortal(
    <dialog
      ref={dialogRef}
      className={mergeCss([dialogCss, backdropCss])}
      onClick={handleBackdropClick}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          className={mergeCss(closeBtnCss)}
          aria-label="Close"
          type="button"
        >
          <X size={20} />
        </button>
      )}

      {children}
    </dialog>,
    document.body
  );
}
