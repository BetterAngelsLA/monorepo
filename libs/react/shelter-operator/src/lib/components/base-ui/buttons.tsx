import { ButtonHTMLAttributes, ReactNode } from 'react';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'floating-light' | 'floating-dark';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button(props: IButtonProps) {
  const {
    variant = 'floating-light',
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  } = props;

  const isFloating =
    variant === 'floating-light' || variant === 'floating-dark';

  const colours: Record<'floating-light' | 'floating-dark', string> = {
    'floating-light': '#008CEE',
    'floating-dark': '#0071C0',
  };

  const buttonCss = [
    className,
    'font-sans font-light focus:outline-none transition-all inline-flex items-center justify-center',
    'text-white shadow-lg',
    isFloating
      ? 'rounded-full flex items-center justify-center gap-[8px]'
      : 'rounded-lg',
  ]
    .filter(Boolean)
    .join(' ');

  const style = isFloating
    ? {
        backgroundColor: colours[variant as 'floating-light' | 'floating-dark'],
        width: '201.91px',
        height: '54.58px',
        paddingTop: '10.79px',
        paddingBottom: '10.79px',
        paddingLeft: '21.58px',
        paddingRight: '21.58px',
      }
    : undefined;

  return (
    <button className={buttonCss} style={style} {...rest}>
      {leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span>{rightIcon}</span>}
    </button>
  );
}
