import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SidebarItemLabel } from './shared/SidebarItemLabel';

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

  return (
    <Link to={to}>
      <SidebarItemLabel
        className={className}
        icon={icon}
        collapsed={collapsed}
        isActive={isActive}
      >
        {children}
      </SidebarItemLabel>
    </Link>
  );
}
