import { Navbar } from '@monorepo/react/betterangels-admin';
import { mergeCss } from '@monorepo/react/components';
import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

type IProps = {
  className?: string;
};

export function AppLayout(props: IProps): ReactElement {
  const { className = '' } = props;

  const parentCss = ['flex', 'flex-row', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AppSidebar className="relative z-10" />
      <Navbar />
      <div className="bg-neutral-99 h-full w-full">
        <Outlet />
      </div>
    </div>
  );
}
