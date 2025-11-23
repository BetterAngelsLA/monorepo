import { RouteObject } from 'react-router-dom';
import Dashboard from './Dashboard';
import Login from './Login';
import OperatorPortal from './OperatorPortal';
import ShelterDashboardPage from './ShelterDashboardPage';

export const operatorRoutes: RouteObject[] = [
  {
    path: '/',
    element: <OperatorPortal />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/shelter/:id',
    element: <ShelterDashboardPage />,
  },
];
