import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

export interface IModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: IModalBodyProps) {
  return (
    <div className={mergeCss(['px-6', 'py-3', className])}>{children}</div>
  );
}
