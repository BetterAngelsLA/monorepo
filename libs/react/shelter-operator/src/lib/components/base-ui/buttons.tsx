import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'floating'
  | 'primary'
  | 'trash'
  | 'edit'
  | 'right-arrow';

export type ButtonColor = 'blue';

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
  primary: 'border text-lg py-2 px-4 rounded-full gap-2 w-fit justify-between',
  edit: 'size-10 p-0 rounded-lg justify-center',
  trash: 'size-10 p-0 rounded-lg justify-center',
  'right-arrow': 'size-11 p-0 rounded-full justify-center',
};

const variantColorDefaults: Record<ButtonVariant, string> = {
  floating: 'bg-[#008CEE] hover:bg-[#0071C0] text-white',
  primary:
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
    floating: 'bg-[#008CEE] hover:bg-[#0071C0] text-white',
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

  const buttonCss = [
    'font-sans font-normal focus:outline-hidden transition-all inline-flex items-center whitespace-nowrap',
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
      {children && <span>{children}</span>}
      {rightIcon && (
        <span className={isIconOnly ? 'flex items-center justify-center' : ''}>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
