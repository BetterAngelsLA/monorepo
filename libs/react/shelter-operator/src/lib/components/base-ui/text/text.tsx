import { mergeCss } from '@monorepo/react/shared';
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
  fontClass?: string;
  textColor?: string;
  textSize?: string;
  fontWeight?: string;
}

const DEFAULT_FONT_CLASS = 'font-sans';
const DEFAULT_TEXT_COLOR_CLASS = 'text-neutral-20';

const variantClasses: Record<TextVariant, string> = {
  'header-lg': 'font-medium text-[1.75rem]',
  'header-md': 'font-medium text-[1.625rem]',
  'header-navbar': 'font-medium text-[1.5rem]',
  subheading: 'font-medium text-[1.25rem]',
  'subheading-regular': 'font-normal text-[1.25rem]',
  btn: 'font-medium text-[1.125rem]',
  'body-lg': 'font-normal text-[1.125rem]',
  'body-bold': 'font-medium text-[1rem]',
  body: 'font-normal text-[1rem]',
  'body-light': 'font-light text-[1rem]',
  tag: 'font-medium text-neutral-50 text-[0.875rem]',
  'tag-sm': 'font-normal text-[0.75rem]',
  'input-field': 'font-normal text-neutral-warm-70 text-[0.875rem]',
  caption: 'font-normal text-neutral-50 text-[0.75rem]',
  'caption-sm': 'font-normal text-neutral-50 text-[0.625rem]',
};

export function Text({
  variant = 'body',
  fontClass,
  textColor,
  textSize,
  fontWeight,
  className = '',
  children,
  ...rest
}: ITextProps) {
  const textClasses = mergeCss([
    DEFAULT_FONT_CLASS,
    DEFAULT_TEXT_COLOR_CLASS,
    variantClasses[variant],
    fontClass,
    fontWeight,
    textSize,
    textColor,
    className,
  ]);

  return (
    <span className={textClasses} {...rest}>
      {children}
    </span>
  );
}
