import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type TModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: TModalSize;
  isCentered?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<TModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  isCentered = true,
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

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  const dialogCss = [
    'fixed',
    'inset-0',
    'z-[10000]',
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
    sizeClasses[size],
  ];

  return createPortal(
    <dialog
      ref={dialogRef}
      className={mergeCss(dialogCss)}
      onClick={handleBackdropClick}
    >
      <div className={mergeCss(boxCss)}>{children}</div>
    </dialog>,
    document.body
  );
}
