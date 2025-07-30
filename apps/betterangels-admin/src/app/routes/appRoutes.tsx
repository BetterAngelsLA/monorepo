import { RouteObject } from 'react-router-dom';
import Home from '../pages/home';
import { ServicesPage } from '../pages/services';
import SignIn from '../pages/sign-in';
import { TeamsPage } from '../pages/teams';
import { UsersPage } from '../pages/usersPage';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/sign-in',
    element: <SignIn />,
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
