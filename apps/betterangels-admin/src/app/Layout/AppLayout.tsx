import { Navbar } from '@monorepo/react/betterangels-admin';
import { Alert, AppDrawer, mergeCss } from '@monorepo/react/components';
import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { DevFlyout } from './DevFlyout';

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

        <div className="flex-1 bg-white overflow-auto px-5 sm:px-20 py-[5.375rem]">
          <Outlet />
        </div>
      </div>
      <AppDrawer />
      <Alert />
      <DevFlyout />
    </div>
  );
}
