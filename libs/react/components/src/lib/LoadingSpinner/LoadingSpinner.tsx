import { mergeCss } from '@monorepo/react/shared';

export type TLoadingSpinnerSize = 'small' | 'medium' | 'large';

const SIZE_VARIANTS: Record<TLoadingSpinnerSize, string> = {
  small: 'h-4 w-4 border-2',
  medium: 'h-6 w-6 border-[4px]',
  large: 'h-8 w-8 border-[5px]',
};

type TProps = {
  size?: TLoadingSpinnerSize;
  className?: string;
};

export function LoadingSpinner(props: TProps) {
  const { size = 'medium', className } = props;

  const sizeCss = SIZE_VARIANTS[size];

  const parentCss = [
    'inline-block',
    'animate-spin',
    'rounded-full',
    'border-neutral-90',
    'border-t-primary-60',
    sizeCss,
    className,
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={mergeCss(parentCss)}
    />
  );
}
