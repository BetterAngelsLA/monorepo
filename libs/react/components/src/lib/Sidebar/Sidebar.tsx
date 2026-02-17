import { mergeCss } from '@monorepo/react/shared';
import { ReactNode, useEffect, useState } from 'react';
import { SidebarContent } from './SidebarContent';
import { SidebarHeader } from './SidebarHeader';
import { SidebarLink } from './SidebarLink';
import { SidebarToggleBtn } from './SidebarToggleBtn';

type TProps = {
  children?: ReactNode;
  className?: string;
  openClassName?: string;
  closedClassName?: string;
  onOpenChange?: (isOpen: boolean) => void;
};

export function Sidebar(props: TProps) {
  const { className, openClassName, closedClassName, children, onOpenChange } =
    props;

  const [isOpen, setIsOpen] = useState(false);

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen]);

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
    'pt-8',
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
    <div className={mergeCss(parentCss)}>
      <SidebarToggleBtn
        open={isOpen}
        className="absolute top-8 right-0 -mr-4"
        onClick={toggleOpen}
      />
      <div className={mergeCss(contentCss)}>
        <div className={mergeCss(childrenCss)}>{children}</div>
      </div>
    </div>
  );
}

Sidebar.Header = SidebarHeader;
Sidebar.Content = SidebarContent;
Sidebar.Link = SidebarLink;
