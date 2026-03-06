import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

export interface IModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: IModalFooterProps) {
  return (
    <div
      className={mergeCss([
        'flex',
        'items-center',
        'justify-end',
        'gap-3',
        'p-6',
        'pt-4',
        className,
      ])}
    >
      {children}
    </div>
  );
}
