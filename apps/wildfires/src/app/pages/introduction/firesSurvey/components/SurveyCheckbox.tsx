import { CheckIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { mergeCss } from '../../../../shared/utils/styles/mergeCss';

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
    'border',
    'rounded-lg',
    'cursor-pointer',
    'text-brand-dark-blue',
    checked ? 'border-brand-dark-blue' : 'border-color-neutral-90',
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
    'border-brand-dark-blue',
    'rounded-md',
    'md:rounded-lg',
    checked ? 'bg-brand-dark-blue' : 'bg-white',
  ];

  const labelCss = [
    'text-base',
    'md:text-xl',
    'text-left',
    'text-wrap',
    'leading-5',
    'md:leading-6',
    'font-semibold',
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
      {['Palisades', 'Eaton', 'Kennet', 'Hurst'].includes(label) ? (
        <div className={mergeCss(labelCss) + " notranslate"}>{label}</div>
      ) : (
        <div className={mergeCss(labelCss)}>{label}</div>
      )}
    </button>
  );
}
