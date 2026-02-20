import { BookCheck, Plus } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'floating-light'
    | 'floating-dark'
    | 'smalllight'
    | 'smallmedium'
    | 'smalldark'
    | 'trashlight'
    | 'trashmedium'
    | 'trashdark'
    | 'editlight'
    | 'editmedium'
    | 'editdark'
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

  const isEdit =
    variant === 'editlight' ||
    variant === 'editmedium' ||
    variant === 'editdark';

  const isTrash =
    variant === 'trashlight' ||
    variant === 'trashmedium' ||
    variant === 'trashdark';

  const isArrowRight = variant === 'rightarrow';

  const shouldHaveDefaultIcons = !isArrowRight && !isEdit && !isTrash;

  const leftIcon =
    props.leftIcon ??
    (shouldHaveDefaultIcons &&
      (isSmall ? <Plus size={24} /> : <BookCheck size={29} />));
  const rightIcon =
    props.rightIcon ??
    (shouldHaveDefaultIcons &&
      (isSmall ? <Plus size={24} /> : <BookCheck size={29} />));

  const colours: Record<
    | 'floating-light'
    | 'floating-dark'
    | 'smalllight'
    | 'smallmedium'
    | 'smalldark'
    | 'trashlight'
    | 'trashmedium'
    | 'trashdark'
    | 'editlight'
    | 'editmedium'
    | 'editdark'
    | 'rightarrow',
    string
  > = {
    'floating-light': '#008CEE',
    'floating-dark': '#0071C0',
    smalllight: '#FFFFFF',
    smallmedium: '#F4F6FD',
    smalldark: '#D3D9E3',
    editlight: '#FFFFFF',
    editmedium: '#F4F6FD',
    editdark: '#D3D9E3',
    trashlight: '#FFFFFF',
    trashmedium: '#FFECE8',
    trashdark: '#FFC5BF',
    rightarrow: '#FFFF00',
  };

  const textColor = isSmall ? 'text-gray-500' : 'text-white';

  const buttonCss = [
    className,
    'font-sans font-normal focus:outline-none transition-all inline-flex items-center h-fit whitespace-nowrap',
    textColor,
    isArrowRight || isEdit || isTrash
      ? 'justify-center'
      : 'justify-between w-fit',
    isFloating ? 'rounded-full shadow-lg gap-2 w-fit' : '',
    isSmall ? 'rounded-full gap-2 w-fit' : '',
    isArrowRight ? 'rounded-full' : '',
    isEdit || isTrash ? 'rounded-lg' : '',
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
    : isEdit || isTrash
    ? {
        backgroundColor: colours[variant],
        width: '40px',
        height: '40px',
        padding: '0',
      }
    : undefined;

  return (
    <button className={buttonCss} style={style} {...rest}>
      {leftIcon && (
        <span
          className={
            isEdit || isTrash ? 'flex items-center justify-center' : ''
          }
        >
          {leftIcon}
        </span>
      )}
      {children && <span>{children}</span>}
      {rightIcon && (
        <span
          className={
            isEdit || isTrash ? 'flex items-center justify-center' : ''
          }
        >
          {rightIcon}
        </span>
      )}
    </button>
  );
}
