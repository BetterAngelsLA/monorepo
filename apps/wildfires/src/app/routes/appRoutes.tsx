import { Link, RouteObject } from 'react-router-dom';
import { HomePage } from '../pages/homePage';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />
  },
];
