import { BookCheck, Plus } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'floating-light'
  | 'floating-dark'
  | 'small-light'
  | 'small-medium'
  | 'small-dark'
  | 'trash-light'
  | 'trash-medium'
  | 'trash-dark'
  | 'edit-light'
  | 'edit-medium'
  | 'edit-dark'
  | 'right-arrow';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const ICON_ONLY_VARIANTS = new Set<ButtonVariant>([
  'edit-light',
  'edit-medium',
  'edit-dark',
  'trash-light',
  'trash-medium',
  'trash-dark',
  'right-arrow',
]);

const SMALL_VARIANTS = new Set<ButtonVariant>([
  'small-light',
  'small-medium',
  'small-dark',
]);

const variantClasses: Record<ButtonVariant, string> = {
  'floating-light':
    'bg-[#008CEE] text-white text-[22px] py-3 px-6 rounded-full shadow-lg gap-2 w-fit justify-between',
  'floating-dark':
    'bg-[#0071C0] text-white text-[22px] py-3 px-6 rounded-full shadow-lg gap-2 w-fit justify-between',
  'small-light':
    'bg-white border border-[#D3D9E3] text-[#747A82] text-lg py-2 px-4 rounded-full gap-2 w-fit justify-between',
  'small-medium':
    'bg-[#F4F6FD] border border-[#D3D9E3] text-lg py-2 px-4 rounded-full gap-2 w-fit justify-between',
  'small-dark':
    'bg-[#D3D9E3] border border-[#D3D9E3] text-[#747A82] text-lg py-2 px-4 rounded-full gap-2 w-fit justify-between',
  'edit-light': 'bg-white text-white size-10 p-0 rounded-lg justify-center',
  'edit-medium':
    'bg-[#F4F6FD] text-white size-10 p-0 rounded-lg justify-center',
  'edit-dark': 'bg-[#D3D9E3] text-white size-10 p-0 rounded-lg justify-center',
  'trash-light': 'bg-white text-white size-10 p-0 rounded-lg justify-center',
  'trash-medium':
    'bg-[#FFECE8] text-white size-10 p-0 rounded-lg justify-center',
  'trash-dark': 'bg-[#FFC5BF] text-white size-10 p-0 rounded-lg justify-center',
  'right-arrow':
    'bg-[#FFF82E] text-white size-11 p-0 rounded-full justify-center',
};

export function Button(props: IButtonProps) {
  const {
    variant = 'floating-light',
    type: _type = 'button',
    className,
    style,
    children,
    ...rest
  } = props;

  const isIconOnly = ICON_ONLY_VARIANTS.has(variant);
  const isSmall = SMALL_VARIANTS.has(variant);

  const leftIcon =
    props.leftIcon ??
    (!isIconOnly && (isSmall ? <Plus size={24} /> : <BookCheck size={29} />));
  const rightIcon =
    props.rightIcon ??
    (!isIconOnly && (isSmall ? <Plus size={24} /> : <BookCheck size={29} />));

  const buttonCss = [
    'font-sans font-normal focus:outline-none transition-all inline-flex items-center h-fit whitespace-nowrap',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonCss} {...rest} style={{ ...style }}>
      {leftIcon && (
        <span className={isIconOnly ? 'flex items-center justify-center' : ''}>
          {leftIcon}
        </span>
      )}
      {children && <span>{children}</span>}
      {rightIcon && (
        <span className={isIconOnly ? 'flex items-center justify-center' : ''}>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
