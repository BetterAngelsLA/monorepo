import { ChevronLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useEffect, useState } from 'react';
import { SidebarItemLabel } from './shared/SidebarItemLabel';

type TProps = {
  className?: string;
  icon?: (color: string) => ReactNode;
  label: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  isActive?: boolean;
  defaultExpanded?: boolean;
  alwaysExpanded?: boolean;
};

export function SidebarNestedLinks(props: TProps) {
  const {
    className,
    icon,
    label,
    children,
    collapsed,
    isActive,
    defaultExpanded = false,
    alwaysExpanded = false,
  } = props;

  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const showChildren = alwaysExpanded || expanded;

  const chevronCss = [
    'h-3',
    'transition-transform',
    'duration-200',
    expanded ? 'rotate-90' : '-rotate-90',
    'text-primary-20',
  ];

  const chevronSuffix = !alwaysExpanded ? (
    <div className="shrink-0 w-[28px] h-full flex items-center justify-center">
      <ChevronLeftIcon className={mergeCss(chevronCss)} />
    </div>
  ) : undefined;

  const childrenCss = ['pl-6', 'pt-2'];

  return (
    <div>
      <button
        type="button"
        className="w-full"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <SidebarItemLabel
          className={className}
          icon={icon}
          collapsed={collapsed}
          isActive={isActive}
          suffix={chevronSuffix}
        >
          {label}
        </SidebarItemLabel>
      </button>

      {!collapsed && showChildren && (
        <div className={mergeCss(childrenCss)}>{children}</div>
      )}
    </div>
  );
}
