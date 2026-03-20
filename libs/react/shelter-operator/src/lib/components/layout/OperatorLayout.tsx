import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '../NavBar';

export function OperatorLayout() {
  const location = useLocation();
  const isDashboardPage = location.pathname === '/operator' || location.pathname === '/operator/';

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar showCreateButton={isDashboardPage} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
