import { RouteObject } from 'react-router-dom';
import { HomePage } from '../pages/home/homePage';
import Policy from '../pages/Policy';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/privacy-policy',
    element: <Policy />
  }
];
