import { mergeCss } from '@monorepo/react/shared';
import { InputHTMLAttributes, ReactNode, useId } from 'react';

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputClassname?: string;
  error?: string;
  iconBefore?: ReactNode;
}

export function Input(props: IInputProps) {
  const {
    label,
    id: propId,
    error,
    className,
    inputClassname,
    iconBefore,
    ...rest
  } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;

  const isRequired = props.required;

  const parentCss = ['flex', 'flex-col', 'w-full', className];
  const errorCss = ['text-sm', 'text-alert-60', 'mt-2'];
  const labelCss = ['text-sm', 'ml-1', 'mb-2', 'flex', 'flex-row'];
  const requiredCss = ['ml-1', 'text-alert-60'];

  const inputWrapperCss = [
    'flex',
    'items-center',
    'bg-neutral-99',
    'rounded-lg',
    'px-4',
    inputClassname,
  ];

  const inputCss = [
    'bg-transparent',
    'focus:outline-none',
    'px-2',
    'py-4',
    'w-full',
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {label && (
        <label htmlFor={id} className={mergeCss(labelCss)}>
          {label}

          {isRequired && <div className={mergeCss(requiredCss)}>*</div>}
        </label>
      )}

      <div className={mergeCss(inputWrapperCss)}>
        {iconBefore && <div>{iconBefore}</div>}

        <input className={mergeCss(inputCss)} id={id} {...rest} />
      </div>

      {error && <div className={mergeCss(errorCss)}>{error}</div>}
    </div>
  );
}
