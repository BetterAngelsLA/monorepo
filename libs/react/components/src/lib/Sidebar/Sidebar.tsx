import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useEffect, useState } from 'react';
import { SidebarToggleBtn } from './shared/SidebarToggleBtn';
import { SidebarContent } from './SidebarContent';
import { SidebarHeader } from './SidebarHeader';
import { SidebarLink } from './SidebarLink';
import { SidebarNestedLinks } from './SidebarNestedLinks';
import {
  SidebarTheme,
  SidebarThemeProvider,
  SidebarVariant,
} from './SidebarTheme';

type TProps = {
  children?: ReactNode;
  className?: string;
  openClassName?: string;
  closedClassName?: string;
  onOpenChange?: (isOpen: boolean) => void;
  initialOpen?: boolean;
  /** Whether the sidebar can be collapsed/expanded. Default: true */
  collapsible?: boolean;
  /** Visual variant. 'basic' hides marker + active background, 'decorated' shows them. Default: 'decorated' */
  variant?: SidebarVariant;
  /** Theme overrides for sidebar items (links, labels, nested groups) */
  theme?: Partial<SidebarTheme>;
};

export function Sidebar(props: TProps) {
  const {
    className,
    openClassName,
    closedClassName,
    children,
    onOpenChange,
    initialOpen = false,
    collapsible = true,
    variant,
    theme,
  } = props;

  const [isOpen, setIsOpen] = useState(collapsible ? initialOpen : true);

  function toggleOpen() {
    if (collapsible) {
      setIsOpen((prev) => !prev);
    }
  }

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const parentCss = [
    'h-screen',
    'border-r',
    'border-neutral-90',
    'bg-neutral-99',
    'relative',
    isOpen ? openClassName : closedClassName,
    className,
  ];

  const contentCss = [
    'flex',
    'flex-col',
    'w-full',
    'h-full',
    'overflow-y-auto',
    'pl-6',
    'pr-8',
  ];

  const childrenCss = [
    isOpen ? 'w-[260px]' : 'w-[40px]',
    'transition-[width]',
    'duration-300',
    'ease-in-out',
    'pb-8',
  ];

  return (
    <SidebarThemeProvider theme={{ variant, ...theme }}>
      <div className={mergeCss(parentCss)}>
        {collapsible && (
          <SidebarToggleBtn
            open={isOpen}
            className="absolute top-8 -translate-y-1/2 right-0 translate-x-1/2 z-10"
            onClick={toggleOpen}
          />
        )}
        <div className={mergeCss(contentCss)}>
          <div className={mergeCss(childrenCss)}>{children}</div>
        </div>
      </div>
    </SidebarThemeProvider>
  );
}

Sidebar.Header = SidebarHeader;
Sidebar.Content = SidebarContent;
Sidebar.Link = SidebarLink;
Sidebar.NestedLinks = SidebarNestedLinks;
