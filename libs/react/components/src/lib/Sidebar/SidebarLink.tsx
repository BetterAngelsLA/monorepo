import { mergeCss } from '@monorepo/react/components';
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

type TProps = {
  className?: string;
  to: string;
  icon?: (color: string) => ReactNode;
  children: ReactNode;
  collapsed?: boolean;
};

export function SidebarLink(props: TProps) {
  const { className, to, icon, collapsed, children } = props;

  const location = useLocation();
  const isActive = location.pathname === to;

  const linkColor = isActive
    ? 'var(--color-primary-60)'
    : 'var(--color-primary-20)';

  const parentCss = [
    'flex',
    'flex-shrink-0',
    'text-sm/21',
    'h-[40px]',
    'items-center',
    'overflow-hidden',
    'w-full',
    'rounded-lg',
    'hover:bg-neutral-98',
    className,
  ];

  const bodyCss = [
    'px-2',
    'truncate',
    isActive ? 'font-semibold text-primary-60' : 'font-normal text-primary-20',
  ];

  const selectedMarkerCss = [
    'ml-auto',
    'flex-shrink-0',
    isActive ? 'bg-primary-60' : 'transparent',
    'w-[5px]',
    'h-[28px]',
    'rounded-l-[20px]',
    'rounded-r-[2px]',
  ];

  const iconWrapperCss = [
    'w-[40px]',
    'flex-shrink-0',
    'h-full',
    'flex',
    'items-center',
    'justify-center',
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
