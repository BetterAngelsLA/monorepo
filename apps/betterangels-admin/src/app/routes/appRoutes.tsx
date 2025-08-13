import { RouteObject } from 'react-router-dom';
import Home from '../pages/home';
import { ServicesPage } from '../pages/services';
import { TeamsPage } from '../pages/teams';
import { UsersPage } from '../pages/users';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/users',
    element: <UsersPage />,
  },
  {
    path: '/teams',
    element: <TeamsPage />,
  },
  {
    path: '/services',
    element: <ServicesPage />,
  },
];
