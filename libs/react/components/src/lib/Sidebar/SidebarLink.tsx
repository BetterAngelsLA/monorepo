import { mergeCss } from '../../utils';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type TProps = {
  className?: string;
  to: string;
  icon?: (color: string) => ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  isActive?: boolean;
};

export function SidebarLink(props: TProps) {
  const { className, to, icon, collapsed, isActive, children } = props;

  const linkColor = isActive
    ? 'var(--color-primary-60)'
    : 'var(--color-primary-20)';

  const parentCss = [
    'relative',
    'flex',
    'flex-shrink-0',
    'text-sm/21',
    'h-[40px]',
    collapsed ? 'w-[40px]' : 'w-full',
    'transition-[width]',
    'duration-300',
    'ease-in-out',
    'items-center',
    'overflow-hidden',
    'rounded-lg',
    'hover:bg-neutral-98',
    isActive ? 'bg-neutral-98' : undefined,
    className,
  ];

  const bodyCss = [
    'px-2',
    'truncate',
    isActive ? 'font-semibold text-primary-60' : 'font-normal text-primary-20',
  ];

  const iconWrapperCss = [
    'w-[40px]',
    'flex-shrink-0',
    'h-full',
    'flex',
    'items-center',
    'justify-center',
  ];

  const selectedMarkerCss = [
    'absolute',
    'right-0',
    'transform',
    'top-1/2',
    '-translate-y-1/2',
    'w-[5px]',
    'h-[70%]',
    'rounded-l-[20px]',
    'rounded-r-[2px]',
    isActive ? 'bg-primary-60' : 'transparent',
  ];

  return (
    <Link to={to} className={mergeCss(parentCss)}>
      {icon && (
        <div className={mergeCss(iconWrapperCss)}>{icon(linkColor)}</div>
      )}

      {!collapsed && <div className={mergeCss(bodyCss)}>{children}</div>}

      <div className={mergeCss(selectedMarkerCss)}></div>
    </Link>
  );
}
