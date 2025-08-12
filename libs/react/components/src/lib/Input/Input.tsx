import { mergeCss } from '@monorepo/react/components';
import { InputHTMLAttributes, useId } from 'react';

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputClassname?: string;
  error?: string;
}

export function Input(props: IInputProps) {
  const {
    label,
    id: propId,
    error,
    className,
    inputClassname,
    ...rest
  } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;

  const isRequired = props.required;

  const parentCss = ['flex', 'flex-col', className];
  const errorCss = ['text-sm', 'text-alert-60', 'mt-2'];
  const labelCss = ['text-sm', 'ml-1', 'mb-2', 'flex', 'flex-row'];
  const requiredCss = ['ml-1', 'text-alert-60'];

  const inputCss = [
    'bg-neutral-99',
    'rounded-lg',
    'focus:outline-none',
    'px-4',
    'py-4',
    inputClassname,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {label && (
        <label htmlFor={id} className={mergeCss(labelCss)}>
          {label}

          {isRequired && <div className={mergeCss(requiredCss)}>*</div>}
        </label>
      )}

      <input className={mergeCss(inputCss)} id={id} {...rest} />

      {error && <div className={mergeCss(errorCss)}>{error}</div>}
    </div>
  );
}
