import { RouteObject } from 'react-router-dom';
import { HomePage } from '../pages/homePage';
import { Introduction } from '../pages/introduction';
import Policy from '../pages/Policy';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/introduction',
    element: <Introduction />,
  },
  {
    path: '/privacy-policy',
    element: <Policy />,
  },
];
