import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useEffect, useRef } from 'react';
import { useSidebarTheme } from '../SidebarTheme/index';

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

  const theme = useSidebarTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const showMarker = theme.variant === 'decorated';

  const linkColor = isActive
    ? theme.fontColorActive ?? theme.activeColor
    : theme.fontColor;

  const markerBg = isActive
    ? theme.markerColor ?? theme.activeColor
    : 'transparent';

  const transitionCss = ['transition-[width]', 'duration-300', 'ease-in-out'];

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
    'items-center',
    'overflow-hidden',
    'rounded-lg',
    transitionCss,
    className,
  ];

  const bodyCss = [
    'px-2',
    'truncate',
    'flex-1',
    theme.variant === 'decorated' ? 'font-normal' : 'font-medium',
    isActive && theme.variant === 'decorated' && 'font-semibold',
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
  ];

  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.style.backgroundColor = '';
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className={mergeCss(parentCss)}
      style={{
        color: linkColor,
        backgroundColor:
          isActive && theme.variant === 'decorated'
            ? theme.bgActive
            : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor =
            theme.bgHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '';
        }
      }}
    >
      {icon && (
        <div className={mergeCss(iconWrapperCss)}>{icon(linkColor)}</div>
      )}

      {collapsed && !icon && (
        <div className={mergeCss(bodyCss)} style={{ color: linkColor }}>
          {children}
        </div>
      )}

      {!collapsed && (
        <div className={mergeCss(bodyCss)} style={{ color: linkColor }}>
          {children}
        </div>
      )}

      {!collapsed && suffix}

      {showMarker && (
        <div
          className={mergeCss(selectedMarkerCss)}
          style={{
            backgroundColor: markerBg,
          }}
        />
      )}
    </div>
  );
}
