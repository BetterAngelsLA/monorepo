import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  className?: string;
  iconClassName?: string;
  iconColor?: string;
};

export function BetterAngelsLogoBadge(props: TProps) {
  const { className, iconClassName, iconColor = '#fff' } = props;

  const parentCss = [
    'w-8',
    'h-8',
    'bg-primary-60',
    'rounded-lg',
    'flex',
    'items-center',
    'justify-center',
    className,
  ];

  const iconCss = ['w-6', iconClassName];

  return (
    <div className={mergeCss(parentCss)}>
      <BetterAngelsLogoIcon fill={iconColor} className={mergeCss(iconCss)} />
    </div>
  );
}
