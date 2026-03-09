import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

export interface IModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: IModalFooterProps) {
  return (
    <div className="relative">
      <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
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
    </div>
  );
}
