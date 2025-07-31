import { ButtonHTMLAttributes } from 'react';
import { mergeCss } from '../../utils';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The size of the button. Determines padding and font size.
   * - `sm`: 26px.
   * - `md`: Medium size (default).
   * - `lg`: Large size.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * The variant of the button. Determines background and text color.
   * - `primary`: primary-20 background, white text.
   * - `secondary`: neutral-99 background, primary-20 text.
   */
  variant?: 'primary' | 'secondary' | 'accent';
}

export function Button(props: IButtonProps) {
  const { size = 'md', variant = 'primary', className, ...rest } = props;

  const sizeClasses = {
    sm: 'h-[26px] px-2 text-sm',
    md: 'h-[32px] px-4 text-base',
    lg: 'h-[40px] px-6 text-lg',
    xl: 'h-[56px] px-4 text-base',
    '2xl': 'h-[64px] px-4 text-base',
  };

  const variantClasses = {
    primary: 'bg-primary-20 text-white',
    secondary: 'bg-neutral-99 text-primary-20 active:bg-neutral-98',
    accent: 'bg-primary-60 text-white',
  };

  const buttonCss = [
    className,
    'font-semibold text-sm focus:outline-none rounded-lg',
    sizeClasses[size],
    variantClasses[variant],
  ];

  return <button className={mergeCss(buttonCss)} {...rest} />;
}
