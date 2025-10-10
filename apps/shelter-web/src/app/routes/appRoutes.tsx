import { Link, RouteObject } from 'react-router-dom';
import Gallery from '../pages/gallery/gallery';
import { Home } from '../pages/home/home';
import { Policy } from '../pages/Policy';
import Shelter from '../pages/shelter/shelter';
import Dashboard from '../shared/components/operator/Dashboard';
import Login from '../shared/components/operator/Login';
import OperatorPortal from '../shared/components/operator/OperatorPortal';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/shelter/:id',
    element: <Shelter />,
  },
  {
    path: '/shelter/:id/gallery',
    element: <Gallery />,
  },
  {
    path: '/privacy-policy',
    element: <Policy />,
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
