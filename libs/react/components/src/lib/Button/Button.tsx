import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The size of the button. Determines padding and font size.
   * - `sm`: 26px.
   * - `md`: Medium size (default).
   * - `lg`: Large size.
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The variant of the button. Determines background and text color.
   * - `primary`: primary-20 background, white text.
   * - `secondary`: neutral-99 background, primary-20 text.
   */
  variant?: 'primary' | 'secondary';
}

export function Button(props: IButtonProps) {
  const { size = 'md', variant = 'primary', className, ...rest } = props;

  const sizeClasses = {
    sm: 'h-[26px] px-2 text-sm',
    md: 'h-[32px] px-4 text-base',
    lg: 'h-[40px] px-6 text-lg',
  };

  const variantClasses = {
    primary: 'bg-primary-20 text-white',
    secondary: 'bg-neutral-99 text-primary-20',
  };

  const buttonClass = clsx(
    className,
    'font-semibold text-sm focus:outline-none rounded-lg',
    sizeClasses[size],
    variantClasses[variant]
  );

  return <button className={buttonClass} {...rest} />;
}
