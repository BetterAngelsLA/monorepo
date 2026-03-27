import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Text } from '../text/text';

export type ButtonVariant =
  | 'floating'
  | 'primary'
  | 'primary-sm'
  | 'trash'
  | 'edit'
  | 'right-arrow';

export type ButtonColor = 'blue' | 'red' | 'green' | 'yellow';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const ICON_ONLY_VARIANTS = new Set<ButtonVariant>([
  'edit',
  'trash',
  'right-arrow',
]);

const variantBaseClasses: Record<ButtonVariant, string> = {
  floating:
    'text-[22px] py-3 px-6 rounded-full shadow-lg gap-2 w-fit justify-between',
  primary: 'border py-2 px-4 rounded-full gap-2 w-fit justify-between',
  'primary-sm': 'border py-1 px-3 rounded-full gap-2 w-fit justify-between',
  edit: 'size-10 p-0 rounded-lg justify-center',
  trash: 'size-10 p-0 rounded-lg justify-center',
  'right-arrow': 'size-11 p-0 rounded-full justify-center',
};

const variantColorDefaults: Record<ButtonVariant, string> = {
  floating: 'bg-[#008CEE] hover:bg-[#0071C0] text-white',
  primary:
    'bg-white hover:bg-[#F4F6FD] disabled:bg-[#D3D9E3] border-[#D3D9E3] text-[#747A82]',
  'primary-sm':
    'bg-white hover:bg-[#F4F6FD] disabled:bg-[#D3D9E3] border-[#D3D9E3] text-[#747A82]',
  edit: 'bg-white hover:bg-[#F4F6FD] active:bg-[#D3D9E3]',
  trash:
    'bg-white hover:bg-[#FFECE8] active:bg-[#FFC5BF] text-black hover:text-[#CB0808]',
  'right-arrow': 'bg-[#FFF82E]',
};

const colorSchemes: Record<
  ButtonColor,
  Partial<Record<ButtonVariant, string>>
> = {
  blue: {
    primary: 'bg-[#008CEE] hover:bg-[#0071C0] border-[#008CEE] text-white',
    'primary-sm': 'bg-[#008CEE] hover:bg-[#0071C0] border-[#008CEE] text-white',
    floating: 'bg-[#008CEE] hover:bg-[#0071C0] text-white',
  },
  red: {
    primary: 'bg-[#CB0808] hover:bg-[#a00606] text-white',
    'primary-sm': 'bg-[#CB0808] hover:bg-[#a00606] text-white',
  },
  green: {
    primary: 'bg-[#23CE6B] hover:bg-[#1db35d] text-white',
    'primary-sm': 'bg-[#23CE6B] hover:bg-[#1db35d] text-white',
  },
  yellow: {
    primary: 'bg-[#FFC700] hover:bg-[#e6b300] text-white',
    'primary-sm': 'bg-[#FFC700] hover:bg-[#e6b300] text-white',
  },
};

const defaultIcons: Partial<Record<ButtonVariant, ReactNode>> = {
  edit: <Pencil size={22} stroke="black" />,
  trash: <Trash2 size={22} color="currentColor" />,
  'right-arrow': <ArrowRight size={24} stroke="black" />,
};

export function Button(props: IButtonProps) {
  const {
    variant = 'primary',
    color,
    type = 'button',
    className,
    style,
    children,
    leftIcon: leftIconProp,
    rightIcon,
    ...rest
  } = props;

  const isIconOnly = ICON_ONLY_VARIANTS.has(variant);
  const leftIcon =
    leftIconProp === undefined ? defaultIcons[variant] : leftIconProp || null;
  const colorClass =
    (color && colorSchemes[color]?.[variant]) ?? variantColorDefaults[variant];
  const textVariant = variant === 'primary-sm' ? 'body' : 'btn';

  const buttonCss = [
    'font-sans focus:outline-hidden inline-flex items-center whitespace-nowrap transition-all',
    isIconOnly ? '' : 'h-fit',
    variantBaseClasses[variant],
    colorClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={buttonCss} {...rest} style={style}>
      {leftIcon && (
        <span className={isIconOnly ? 'flex items-center justify-center' : ''}>
          {leftIcon}
        </span>
      )}
      {children && (
        <Text variant={textVariant} textColor="text-inherit">
          {children}
        </Text>
      )}
      {rightIcon && (
        <span className={isIconOnly ? 'flex items-center justify-center' : ''}>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
