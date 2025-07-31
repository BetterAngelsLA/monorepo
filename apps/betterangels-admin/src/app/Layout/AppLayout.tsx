import { Navbar } from '@monorepo/react/betterangels-admin';
import { Alert, AppDrawer, mergeCss } from '@monorepo/react/components';
import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

type IProps = {
  className?: string;
};

export function AppLayout(props: IProps): ReactElement {
  const { className = '' } = props;

  const parentCss = ['flex', 'flex-row', 'h-screen', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <Navbar />

        <div className="flex-1 bg-neutral-99 overflow-auto">
          <Outlet />
        </div>
      </div>
      <AppDrawer />
      <Alert />
    </div>
  );
}
