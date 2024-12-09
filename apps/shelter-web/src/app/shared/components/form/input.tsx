import { forwardRef } from 'react';

type TInput = {
  className?: string;
  placeholder?: string;
};

export const Input = forwardRef<HTMLInputElement, TInput>((props, ref) => {
  const { className = '', placeholder } = props;

  const inputCss = [
    className,
    'w-full',
    'px-4',
    'py-4',
    'font-normal',
    'leading-6',
    'border ',
    'border-neutral-90',
    'rounded-lg',
    'text-sm',
    'placeholder:text-sm',
    'placeholder:text-neutral-40',
    'focus-visible:transparent',
  ].join(' ');

  return <input ref={ref} placeholder={placeholder} className={inputCss} />;
});
