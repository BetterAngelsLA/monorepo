import { CloseIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { InputHTMLAttributes, ReactNode, useId } from 'react';

export interface IInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  inputClassname?: string;
  placeholderClassname?: string;
  error?: string;
  iconBefore?: ReactNode;
  noClearBtn?: boolean;
  onChange?: (value: string) => void;
}

export function Input(props: IInputProps) {
  const {
    label,
    id: propId,
    onChange,
    error,
    className,
    inputClassname,
    placeholderClassname,
    iconBefore,
    noClearBtn,
    ...rest
  } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;

  const isRequired = props.required;

  const parentCss = ['flex', 'flex-col', 'w-full', className];
  const errorCss = ['text-sm', 'text-alert-60', 'mt-2'];
  const labelCss = ['text-sm', 'ml-1', 'mb-2', 'flex', 'flex-row'];
  const requiredCss = ['ml-1', 'text-alert-60'];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value);
  }

  function onClear() {
    onChange?.('');
  }

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
    'focus:outline-hidden',
    'px-2',
    'py-4',
    'w-full',
    placeholderClassname,
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
        {iconBefore && <div className="mr-2">{iconBefore}</div>}

        <input
          className={mergeCss(inputCss)}
          id={id}
          onChange={handleChange}
          {...rest}
        />

        {!noClearBtn && (
          <div className="ml-2">
            <div
              className="bg-neutral-90 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
              onClick={onClear}
            >
              <CloseIcon className="w-2 h-2" />
            </div>
          </div>
        )}
      </div>

      {error && <div className={mergeCss(errorCss)}>{error}</div>}
    </div>
  );
}
