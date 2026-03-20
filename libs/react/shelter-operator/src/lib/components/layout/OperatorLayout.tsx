import { Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@monorepo/react/shelter';
import NavBar from '../NavBar';

export function OperatorLayout() {
  const location = useLocation();
  const { user } = useUser();
  const isDashboardPage = location.pathname === '/operator' || location.pathname === '/operator/';
  
  const isReservationPage = location.pathname.includes('/reservation');
  const organizationName = user?.organization?.name;
  const pageTitle = isReservationPage ? 'Shelter Reservation' : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar
        showCreateButton={isDashboardPage}
        organizationName={organizationName}
        pageTitle={pageTitle}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
