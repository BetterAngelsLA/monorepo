import { CheckIcon } from '@monorepo/react/icons';
import { ReactElement, useEffect, useState } from 'react';

export type ICheckbox = {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function Checkbox(props: ICheckbox): ReactElement {
  const { checked, onChange, label, disabled, className } = props;

  const [isChecked, setIsChecked] = useState(!!checked);

  function handleChange(): void {
    if (disabled) {
      return;
    }

    const newChecked = !isChecked;

    setIsChecked(newChecked);
  }

  useEffect(() => {
    if (onChange) {
      onChange(isChecked);
    }
  }, [isChecked]);

  useEffect(() => {
    setIsChecked(!!checked);
  }, [checked]);

  let parentCss: string = [
    'flex',
    'justify-between',
    'items-start',
    'w-full',
    'text-sm',
    'px-4',
    'py-2',
    'border',
    'rounded-lg',
    !!isChecked
      ? 'border-primary-95 bg-primary-95'
      : 'border-neutral-90 bg-white',
    className,
  ].join(' ');

  let checkboxContainerCss: string = [
    'mt-0.5',
    'w-4',
    'h-4',
    'overflow-hidden',
    'flex',
    'items-center',
    'border',
    !!isChecked
      ? 'border-primary-20 bg-primary-20'
      : 'border-neutral-90 bg-white',
    'rounded-sm',
    className,
  ].join(' ');

  return (
    <button className={parentCss} onClick={handleChange} disabled={disabled}>
      <span className="flex flex-wrap">{label}</span>
      <div className={checkboxContainerCss}>
        {isChecked && <CheckIcon className="text-white" />}
      </div>
    </button>
  );
}
