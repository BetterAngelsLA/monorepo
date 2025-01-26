import { CheckIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { mergeCss } from '../../../../shared/utils/styles/mergeCss';
import { wildfireLabels } from '../config/forms/questions/whichFire';

type IProps = {
  label: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

export function SurveyCheckbox(props: IProps): ReactElement {
  const { checked, onChange, label, disabled, className } = props;

  function handleChange(): void {
    if (disabled) {
      return;
    }

    onChange(!checked);
  }

  const parentCss = [
    'flex',
    'items-start',
    'w-full',
    'items-center',
    'px-4',
    'py-4',
    'lg:py-6',
    'border-2',
    'rounded-xl',
    'cursor-pointer',
    'text-brand-dark-blue',
    checked ? 'border-brand-dark-blue' : 'border-[#DBDBDB]',
    disabled ? 'opacity-70 cursor-not-allowed' : '',
    className,
  ];

  const checkboxContainerCss = [
    'overflow-hidden',
    'flex',
    'items-center',
    'justify-center',
    'mr-6',
    'h-6 lg:h-[30px]',
    'w-6 lg:w-[30px]',
    'min-w-6 lg:min-w-[30px]',
    'border',
    'text-brand-dark-blue',
    'border-steel-blue',
    'rounded-[5px]',
    'md:rounded-lg',
    checked ? 'bg-brand-dark-blue' : 'bg-white',
  ];

  const labelCss = [
    'text-base',
    'md:text-xl',
    'text-left',
    'text-wrap',
    'leading-[22px]',
    'md:leading-[30px]',
    'font-bold',
  ];

  return (
    <button
      className={mergeCss(parentCss)}
      onClick={handleChange}
      disabled={disabled}
    >
      <div className={mergeCss(checkboxContainerCss)}>
        {checked && <CheckIcon className="text-white h-8" />}
      </div>
      {wildfireLabels.includes(label) ? (
        <div className={mergeCss(labelCss) + ' notranslate'}>{label}</div>
      ) : (
        <div className={mergeCss(labelCss)}>{label}</div>
      )}
    </button>
  );
}
