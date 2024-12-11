import CloseIcon from '@svg/mingcute_design/svg/mingcute:close-fill.svg?react';
import { InputHTMLAttributes, ReactElement, Ref, forwardRef } from 'react';

type AllowedTypes = string | number;
interface IInput<T extends AllowedTypes = string>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: T;
  onChange?: (value: T) => void;
  leftIcon?: ReactElement;
  noClearBtn?: boolean;
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
}

export const Input = forwardRef(InputInner) as <T extends AllowedTypes>(
  props: IInput<T> & React.RefAttributes<HTMLInputElement>
) => JSX.Element;

function InputInner<T extends AllowedTypes>(
  props: IInput<T>,
  ref: Ref<HTMLInputElement>
) {
  const {
    className = '',
    value,
    type = 'text',
    onChange,
    placeholder,
    required,
    disabled,
    autoComplete,
    spellCheck,
    leftIcon,
    noClearBtn,
    ...rest
  } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) {
      return;
    }

    const inputValue = e.currentTarget.value;

    if (e.currentTarget.type === 'number') {
      if (inputValue === '') {
        onChange(undefined as unknown as T);

        return;
      }

      if (inputValue === '0') {
        onChange(0 as T);

        return;
      }

      const numericValue = inputValue.replace(/^0+/, '');

      onChange(Number(numericValue) as T);

      return;
    }

    onChange(String(inputValue) as T);
  };

  function onClear() {
    if (!onChange) {
      return;
    }

    const clearedValue = typeof value === 'number' ? undefined : '';

    onChange(clearedValue as T);
  }

  const parentCss = [
    className,
    'p-4',
    'flex',
    'items-center',
    'border ',
    'border-neutral-90',
    'rounded-lg',
  ].join(' ');

  const inputCss = [
    'w-full',
    'font-normal',
    'leading-6',
    'text-sm',
    'placeholder:text-sm',
    'placeholder:text-neutral-40',
    'focus-visible:transparent',
  ].join(' ');

  return (
    <div className={parentCss}>
      {!!leftIcon && <div className="mr-4">{leftIcon}</div>}

      <input
        ref={ref}
        value={value ?? ''}
        type={type}
        onChange={handleChange}
        placeholder={placeholder}
        className={inputCss}
        required={required}
        disabled={disabled}
        autoComplete={String(!!autoComplete)}
        autoCorrect={String(!!autoComplete)}
        spellCheck={!!spellCheck}
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
  );
}
