import { mergeCss } from '@monorepo/react/components';
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
    // 'border-4 border-blue-500',
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
    // 'border-4 border-green-500',
  ];

  console.log('*****************  SIDEBAR isOpen:', isOpen);
  return (
    <div className={mergeCss(parentCss)}>
      <SidebarToggleBtn
        open={isOpen}
        className="absolute top-8 right-0 -mr-4 border-4-x border-red-500"
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
