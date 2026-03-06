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
}

const variantClasses: Record<TextVariant, string> = {
  'header-lg': 'font-poppins font-medium text-[28px]',
  'header-md': 'font-poppins font-medium text-[26px]',
  'header-navbar': 'font-poppins font-medium text-[24px]',
  subheading: 'font-poppins font-medium text-[20px]',
  'subheading-regular': 'font-poppins font-normal text-[20px]',
  btn: 'font-poppins font-medium text-[18px]',
  'body-lg': 'font-poppins font-normal text-[18px]',
  'body-bold': 'font-poppins font-medium text-[16px]',
  body: 'font-poppins font-normal text-[16px]',
  'body-light': 'font-poppins font-light text-[16px]',
  tag: 'font-poppins font-medium text-[14px]',
  'tag-sm': 'font-poppins font-normal text-[12px]',
  'input-field': 'font-poppins font-normal text-[14px]',
  caption: 'font-poppins font-normal text-[12px]',
  'caption-sm': 'font-poppins font-normal text-[10px]',
};

export function Text({
  variant = 'body',
  className = '',
  children,
  ...rest
}: ITextProps) {
  const textClasses = `${variantClasses[variant]} ${className}`.trim();

  return (
    <span className={textClasses} {...rest}>
      {children}
    </span>
  );
}
