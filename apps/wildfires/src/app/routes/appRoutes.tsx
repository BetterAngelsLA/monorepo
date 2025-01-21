import { RouteObject } from 'react-router-dom';
import { HomePage } from '../pages/home/homePage';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
];
