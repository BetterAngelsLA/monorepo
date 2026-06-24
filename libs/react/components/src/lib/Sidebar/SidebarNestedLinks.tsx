import { ChevronLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useEffect, useState } from 'react';
import { SidebarItemLabel } from './shared/SidebarItemLabel';
import { useSidebarTheme } from './SidebarTheme/index';

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
  const theme = useSidebarTheme();

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const isOpen = alwaysExpanded || expanded;

  const chevronCss = [
    'h-3',
    'transition-transform',
    'duration-200',
    expanded ? 'rotate-90' : '-rotate-90',
  ];

  const chevronSuffix = !alwaysExpanded && (
    <div className="shrink-0 w-[28px] h-full flex items-center justify-center">
      <ChevronLeftIcon
        className={mergeCss(chevronCss)}
        style={{ color: theme.fontColor }}
      />
    </div>
  );

  const childrenCss = ['pl-4', 'pt-2'];

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

      {isOpen && <div className={mergeCss(childrenCss)}>{children}</div>}
    </div>
  );
}
