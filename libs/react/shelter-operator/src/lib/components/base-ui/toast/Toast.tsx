import { mergeCss } from '@monorepo/react/shared';
import { X } from 'lucide-react';
import { toastVariantConfig } from './constants';
import { IToastProps } from './types';

export function Toast({
  status,
  title,
  description,
  action,
  onClose,
}: IToastProps) {
  const { Icon, iconBgClass, iconColorClass, actionButtonClass } =
    toastVariantConfig[status];

  return (
    <div
      className={mergeCss([
        'bg-white',
        'rounded-2xl',
        'border',
        'border-[#D3D9E3]',
        'p-5',
        'w-[340px]',
        'animate-[slideInFromRight_300ms_ease-in-out_forwards]',
      ])}
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.10)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className={mergeCss([
            'flex',
            'items-center',
            'justify-center',
            'w-10',
            'h-10',
            'rounded-full',
            'flex-shrink-0',
            iconBgClass,
          ])}
        >
          <Icon size={20} className={iconColorClass} />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-base font-semibold text-[#383B40]">{title}</p>
          {description && (
            <p className="text-sm text-[#747A82] mt-0.5">{description}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-[#F4F6FD] transition-colors text-[#747A82]"
        >
          <X size={18} />
        </button>
      </div>

      {action && (
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className={mergeCss([
              'px-5',
              'py-2',
              'rounded-full',
              'text-sm',
              'font-medium',
              'border',
              'border-[#D3D9E3]',
              'text-[#383B40]',
              'hover:bg-[#F4F6FD]',
              'transition-colors',
            ])}
          >
            Cancel
          </button>
          <button
            onClick={action.onClick}
            className={mergeCss([
              'px-5',
              'py-2',
              'rounded-full',
              'text-sm',
              'font-medium',
              'text-white',
              'transition-colors',
              actionButtonClass,
            ])}
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
