import { RouteObject } from 'react-router-dom';
import { ServicesPage } from '../pages/services';
import { TeamsPage } from '../pages/teams';
import { UsersPage } from '../pages/users';

export const routeChildren: RouteObject[] = [
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
