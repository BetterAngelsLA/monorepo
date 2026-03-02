import { mergeCss } from '@monorepo/react/shared';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

export interface IModalHeaderProps {
  showCloseButton?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

export function ModalHeader({
  showCloseButton = true,
  onClose,
  children,
}: IModalHeaderProps) {
  return (
    <div className={mergeCss(['flex', 'items-start', 'justify-between', 'p-6', 'pb-2'])}>
      <div className="flex items-center gap-3 flex-1">{children}</div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className={mergeCss([
            'ml-2',
            'p-1',
            'rounded-full',
            'hover:bg-[#F4F6FD]',
            'transition-colors',
            'text-[#747A82]',
          ])}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
