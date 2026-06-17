import { mergeCss } from '@monorepo/react/shared';
import { X } from 'lucide-react';
import { MouseEvent, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type TModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: TModalSize;
  isCentered?: boolean;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
  children: ReactNode;
}

const sizeClasses: Record<TModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'w-full h-full max-w-none max-h-none rounded-none bg-transparent',
};

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  isCentered = true,
  showCloseButton = false,
  closeButtonClassName,
  children,
}: IModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    function handleCancel(e: Event) {
      e.preventDefault();
      onClose();
    }

    dialog.addEventListener('cancel', handleCancel);

    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!isOpen) return null;

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  const dialogCss = [
    'fixed',
    'inset-0',
    'z-400',
    'bg-transparent',
    'p-0',
    'm-0',
    'w-full',
    'h-full',
    'max-w-none',
    'max-h-none',
    isCentered && 'flex items-center justify-center',
    'backdrop:bg-black/50',
  ];

  const boxCss = [
    'bg-white',
    'rounded-2xl',
    'shadow-xl',
    'p-0',
    'w-full',
    'max-h-[85vh]',
    'flex',
    'flex-col',
    sizeClasses[size],
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
      className={mergeCss(dialogCss)}
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
      <div className={mergeCss(boxCss)}>{children}</div>
    </dialog>,
    document.body
  );
}
