import { CheckIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { mergeCss } from '../../utils/mergeCss';

export type ICheckbox = {
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export function Checkbox(props: ICheckbox): ReactElement {
  const { checked, onChange, label, disabled, className } = props;

  function handleChange(): void {
    if (disabled) {
      return;
    }

    onChange(!checked);
  }

  const parentCss = [
    'flex',
    'justify-between',
    'items-start',
    'w-full',
    'text-sm',
    'px-4',
    'py-2',
    'border',
    'rounded-lg',
    checked ? 'border-primary-95 bg-primary-95' : 'border-neutral-90 bg-white',
    className,
  ];

  const checkboxContainerCss = [
    'mt-0.5',
    'w-4',
    'h-4',
    'overflow-hidden',
    'flex',
    'items-center',
    'justify-center',
    'border',
    checked ? 'border-primary-20 bg-primary-20' : 'border-neutral-90 bg-white',
    'rounded-sm',
  ];

  return (
    <button
      className={mergeCss(parentCss)}
      onClick={handleChange}
      disabled={disabled}
    >
      <div className="text-left text-wrap">{label}</div>
      <div className={mergeCss(checkboxContainerCss)}>
        {checked && <CheckIcon className="text-white h-4" />}
      </div>
    </button>
  );
}
