import { BookCheck, Plus } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'floating-light'
    | 'floating-dark'
    | 'smalllight'
    | 'smallmedium'
    | 'smalldark';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button(props: IButtonProps) {
  const { variant = 'floating-light', className, children, ...rest } = props;

  const isFloating =
    variant === 'floating-light' || variant === 'floating-dark';

  const isSmall =
    variant === 'smalllight' ||
    variant === 'smallmedium' ||
    variant === 'smalldark';

  const leftIcon = props.leftIcon ?? (isSmall ? <Plus /> : <BookCheck />);
  const rightIcon = props.rightIcon ?? (isSmall ? <Plus /> : <BookCheck />);

  const colours: Record<
    | 'floating-light'
    | 'floating-dark'
    | 'smalllight'
    | 'smallmedium'
    | 'smalldark',
    string
  > = {
    'floating-light': '#008CEE',
    'floating-dark': '#0071C0',
    smalllight: '#FFFFFF',
    smallmedium: '#F4F6FD',
    smalldark: '#D3D9E3',
  };

  const textColor = isSmall ? 'text-gray-500' : 'text-white';

  const buttonCss = [
    className,
    'font-sans font-normal focus:outline-none transition-all inline-flex items-center justify-center',
    textColor,
    isFloating ? 'shadow-lg' : '',
    'rounded-full flex items-center justify-center gap-[12px]',
  ]
    .filter(Boolean)
    .join(' ');

  const style = isFloating
    ? {
        backgroundColor: colours[variant],
        width: '201.91px',
        height: '54.58px',
        paddingTop: '10.79px',
        paddingBottom: '10.79px',
        paddingLeft: '21.58px',
        paddingRight: '21.58px',
      }
    : isSmall
    ? {
        backgroundColor: colours[variant],
        padding: '12px 24px',
        border: '1px solid #D3D9E3',
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
