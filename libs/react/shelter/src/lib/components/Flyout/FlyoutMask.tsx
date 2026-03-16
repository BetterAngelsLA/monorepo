import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClickOutside?: () => void;
}

export function FlyoutMask({ children, onClickOutside }: Props) {
  return (
    <div className="fixed inset-0 z-100 bg-black/50" onClick={onClickOutside}>
      {children}
    </div>
  );
}
