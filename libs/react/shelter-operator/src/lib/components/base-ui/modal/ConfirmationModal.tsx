import { mergeCss } from '@monorepo/react/shared';
import { CheckCircle, Info, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '../buttons/buttons';
import { Text } from '../text/text';
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
    buttonClass: 'red',
  },
  success: {
    Icon: CheckCircle,
    iconBgClass: 'bg-[#DDF8E8]',
    iconColorClass: 'text-[#23CE6B]',
    buttonClass: 'green',
  },
  info: {
    Icon: Info,
    iconBgClass: 'bg-[#DCF1FF]',
    iconColorClass: 'text-[#008CEE]',
    buttonClass: 'blue',
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
        <Text
          variant="header-md"
          className="block font-semibold text-[#383B40]"
        >
          {title}
        </Text>

        {description && (
          <Text variant="body-lg" className="mt-1 block text-[#747A82]">
            {description}
          </Text>
        )}
      </ModalBody>

      <ModalFooter>
        {secondaryAction && (
          <Button
            variant="primary"
            onClick={secondaryAction.onClick}
            className={mergeCss(['font-medium', 'transition-colors'])}
          >
            {secondaryAction.label}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={primaryAction.onClick}
          disabled={primaryAction.isLoading}
          color={buttonClass}
          className={mergeCss([
            'font-medium',
            'transition-colors',
            'disabled:opacity-50',
          ])}
        >
          {primaryAction.isLoading ? 'Loading...' : primaryAction.label}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
