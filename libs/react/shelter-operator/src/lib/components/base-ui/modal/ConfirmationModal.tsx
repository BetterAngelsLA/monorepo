import { mergeCss } from '@monorepo/react/shared';
import { CheckCircle, Info, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';
import { Modal } from './Modal';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';
import { ModalHeader } from './ModalHeader';

type TConfirmationVariant = 'danger' | 'success' | 'info';

interface IConfirmationAction {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
}

export interface IConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  variant?: TConfirmationVariant;
  primaryAction: IConfirmationAction;
  secondaryAction?: IConfirmationAction;
}

const variantConfig: Record<
  TConfirmationVariant,
  {
    Icon: typeof Trash2;
    iconBgClass: string;
    iconColorClass: string;
    buttonClass: string;
  }
> = {
  danger: {
    Icon: Trash2,
    iconBgClass: 'bg-[#FFECE8]',
    iconColorClass: 'text-[#CB0808]',
    buttonClass: 'bg-[#CB0808] hover:bg-[#a00606]',
  },
  success: {
    Icon: CheckCircle,
    iconBgClass: 'bg-[#DDF8E8]',
    iconColorClass: 'text-[#23CE6B]',
    buttonClass: 'bg-[#23CE6B] hover:bg-[#1db35d]',
  },
  info: {
    Icon: Info,
    iconBgClass: 'bg-[#DCF1FF]',
    iconColorClass: 'text-[#008CEE]',
    buttonClass: 'bg-[#008CEE] hover:bg-[#0374c4]',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  primaryAction,
  secondaryAction,
}: IConfirmationModalProps) {
  const { Icon, iconBgClass, iconColorClass, buttonClass } =
    variantConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <div
          className={mergeCss([
            'flex',
            'items-center',
            'justify-center',
            'w-10',
            'h-10',
            'rounded-full',
            iconBgClass,
          ])}
        >
          <Icon size={20} className={iconColorClass} />
        </div>
      </ModalHeader>

      <ModalBody>
        <h3 className="text-lg font-semibold text-[#383B40]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-[#747A82]">{description}</p>
        )}
      </ModalBody>

      <ModalFooter>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className={mergeCss([
              'px-5',
              'py-2',
              'rounded-lg',
              'text-sm',
              'font-medium',
              'border',
              'border-[#D3D9E3]',
              'text-[#383B40]',
              'hover:bg-[#F4F6FD]',
              'transition-colors',
            ])}
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.isLoading}
          className={mergeCss([
            'px-5',
            'py-2',
            'rounded-lg',
            'text-sm',
            'font-medium',
            'text-white',
            'transition-colors',
            'disabled:opacity-50',
            buttonClass,
          ])}
        >
          {primaryAction.isLoading ? 'Loading...' : primaryAction.label}
        </button>
      </ModalFooter>
    </Modal>
  );
}
