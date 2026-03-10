import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClickOutside?: () => void;
}

export function FlyoutMask({ children, onClickOutside }: Props) {
  return (
    <div
      className="fixed inset-0 z-flyout-mask bg-black bg-opacity-50"
      onClick={onClickOutside}
    >
      {children}
    </div>
  );
}
