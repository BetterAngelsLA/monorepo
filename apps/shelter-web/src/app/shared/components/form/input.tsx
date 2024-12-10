import CloseIcon from '@svg/mingcute_design/svg/mingcute:close-fill.svg?react';
import { ChangeEvent, ReactElement, forwardRef } from 'react';

type TInput = {
  className?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  withClear?: boolean;
  autocomplete?: boolean;
  spellcheck?: boolean;
  leftIcon?: ReactElement;
  noClearBtn?: boolean;
};

export const Input = forwardRef<HTMLInputElement, TInput>((props, ref) => {
  const {
    className = '',
    value = '',
    onChange,
    placeholder,
    required,
    disabled,
    autocomplete,
    spellcheck,
    leftIcon,
    noClearBtn,
  } = props;

  function onValueChange(e: ChangeEvent<HTMLInputElement>): void {
    const value = e.currentTarget.value as string;

    onChange(value);
  }

  function onClear() {
    onChange('');
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
        value={value}
        onChange={onValueChange}
        placeholder={placeholder}
        className={inputCss}
        required={required}
        disabled={disabled}
        autoComplete={String(!!autocomplete)}
        autoCorrect={String(!!autocomplete)}
        spellCheck={!!spellcheck}
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
});
