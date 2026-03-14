import { HTMLAttributes } from 'react';

export type TextVariant =
  | 'header-lg'
  | 'header-md'
  | 'header-navbar'
  | 'subheading'
  | 'subheading-regular'
  | 'btn'
  | 'body-lg'
  | 'body-bold'
  | 'body'
  | 'body-light'
  | 'tag'
  | 'tag-sm'
  | 'input-field'
  | 'caption'
  | 'caption-sm';

export interface ITextProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TextVariant;
  font?: string;
  color?: string;
  size?: string;
  weight?: string;
}

const DEFAULT_FONT = 'font-poppins';

const variantClasses: Record<TextVariant, string> = {
  'header-lg': 'font-medium text-[1.75rem]',
  'header-md': 'font-medium text-[1.625rem]',
  'header-navbar': 'font-medium text-[1.5rem]',
  subheading: 'font-medium text-[1.25rem]',
  'subheading-regular': 'font-normal text-[1.25rem]',
  btn: 'font-medium text-[1.125rem]',
  'body-lg': 'font-normal text-[#1C1B1F] text-[1.125rem]',
  'body-bold': 'font-medium text-[1rem]',
  body: 'font-normal text-[1rem]',
  'body-light': 'font-light text-[1rem]',
  tag: 'font-medium text-[#747A82] text-[0.875rem]',
  'tag-sm': 'font-normal text-[0.75rem]',
  'input-field': 'font-normal text-[#676767] text-[0.875rem]',
  caption: 'font-normal text-[#747A82] text-[0.75rem]',
  'caption-sm': 'font-normal text-[#747A82] text-[0.625rem]',
};

export function Text({
  variant = 'body',
  font,
  color,
  size,
  weight,
  className = '',
  children,
  ...rest
}: ITextProps) {
  const textClasses = [
    font ?? DEFAULT_FONT,
    variantClasses[variant],
    weight,
    size,
    color,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={textClasses} {...rest}>
      {children}
    </span>
  );
}
