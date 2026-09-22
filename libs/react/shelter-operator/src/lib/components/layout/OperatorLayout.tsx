import { AppDrawer } from '@monorepo/react/components';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../AppSidebar';
import { NavBar } from '../NavBar';
import { ToastContainer } from '../base-ui/toast';

export function OperatorLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <NavBar className="border-b border-gray-200" />

      <div className="flex flex-row flex-1 min-h-0">
        <AppSidebar />

        <main className="pt-6 px-6 flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>

        <ToastContainer />
        <AppDrawer />
      </div>
    </div>
  );
}
