import { BookCheck, Plus } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'floating-light'
    | 'floating-dark'
    | 'smalllight'
    | 'smallmedium'
    | 'smalldark'
    | 'rightarrow';
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

  const isArrowRight = variant === 'rightarrow';

  const leftIcon =
    props.leftIcon ??
    (!isArrowRight && (isSmall ? <Plus size={24} /> : <BookCheck size={29} />));
  const rightIcon =
    props.rightIcon ??
    (!isArrowRight && (isSmall ? <Plus size={24} /> : <BookCheck size={29} />));

  const colours: Record<
    | 'floating-light'
    | 'floating-dark'
    | 'smalllight'
    | 'smallmedium'
    | 'smalldark'
    | 'rightarrow',
    string
  > = {
    'floating-light': '#008CEE',
    'floating-dark': '#0071C0',
    smalllight: '#FFFFFF',
    smallmedium: '#F4F6FD',
    smalldark: '#D3D9E3',
    rightarrow: '#FFFF00',
  };

  const textColor = isSmall ? 'text-gray-500' : 'text-white';

  const buttonCss = [
    className,
    'font-sans font-normal focus:outline-none transition-all inline-flex items-center rounded-full h-fit whitespace-nowrap',
    textColor,
    isArrowRight ? 'justify-center' : 'justify-between',
    isFloating ? 'shadow-lg gap-2 w-fit' : '',
    isSmall ? 'gap-2 w-fit' : '',
    isArrowRight ? '' : 'w-fit',
  ]
    .filter(Boolean)
    .join(' ');

  const style = isFloating
    ? {
        backgroundColor: colours[variant],
        fontSize: '22px',
        padding: '12px 24px',
      }
    : isSmall
    ? {
        backgroundColor: colours[variant],
        border: '1px solid #D3D9E3',
        fontSize: '18px',
        padding: '8px 16px',
      }
    : isArrowRight
    ? {
        backgroundColor: colours[variant],
        width: '44px',
        height: '44px',
        padding: '0',
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
