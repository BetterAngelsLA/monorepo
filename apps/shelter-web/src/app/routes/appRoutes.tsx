import { Link, RouteObject } from 'react-router-dom';
import Dashboard from '../pages/operator/Dashboard';
import Login from '../pages/operator/Login';
import OperatorPortal from '../pages/operator/OperatorPortal';
import { GalleryRoute } from './gallery.route';
import { HomeRoute } from './home.route';
import { PolicyRoute } from './policy.route';
import { ShelterRoute } from './shelter.route';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <HomeRoute />,
  },
  {
    path: '/shelter/:id',
    element: <ShelterRoute />,
  },
  {
    path: '/shelter/:id/gallery',
    element: <GalleryRoute />,
  },
  {
    path: '/privacy-policy',
    element: <PolicyRoute />,
  },
  {
    path: '/operator',
    element: <OperatorPortal />,
  },
  {
    path: '/operator/login',
    element: <Login />,
  },
  {
    path: '/operator/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/page-2',
    element: (
      <div>
        <div>PAGE 2</div>
        <Link to="/">go to home page</Link>
      </div>
    ),
  },
];
