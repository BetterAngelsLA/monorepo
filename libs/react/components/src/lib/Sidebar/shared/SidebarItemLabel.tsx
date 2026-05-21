import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  icon?: (color: string) => ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  isActive?: boolean;
  suffix?: ReactNode;
};

export function SidebarItemLabel(props: TProps) {
  const { className, icon, collapsed, isActive, children, suffix } = props;

  const linkColor = isActive
    ? 'var(--color-primary-60)'
    : 'var(--color-primary-20)';

  const parentCss = [
    'relative',
    'flex',
    'shrink-0',
    'text-sm/21',
    'h-[40px]',
    'leading-[40px]',
    'text-left',
    'cursor-pointer',
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
    'flex-1',
    isActive ? 'font-semibold text-primary-60' : 'font-normal text-primary-20',
  ];

  const iconWrapperCss = [
    'w-[40px]',
    'shrink-0',
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
    <div className={mergeCss(parentCss)}>
      {icon && (
        <div className={mergeCss(iconWrapperCss)}>{icon(linkColor)}</div>
      )}

      {!collapsed && <div className={mergeCss(bodyCss)}>{children}</div>}

      {!collapsed && suffix}

      <div className={mergeCss(selectedMarkerCss)}></div>
    </div>
  );
}
