import { OperatorApp } from '@monorepo/react/shelter-operator';
import { Link, RouteObject } from 'react-router-dom';
import Dashboard from '../../../../shelter-operator/Dashboard';
import Login from '../../../../shelter-operator/Login';
import OperatorPortal from '../../../../shelter-operator/OperatorPortal';
import CreateShelterForm from '../../../../shelter-operator/components/create-shelter-form';
import { Policy } from '../pages/Policy';
import Gallery from '../pages/gallery/gallery';
import { Home } from '../pages/home/home';
import Shelter from '../pages/shelter/shelter';

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
    path: '/operator/*',
    element: <OperatorApp />,
  },
  {
    path: '/operator/dashboard/create',
    element: <CreateShelterForm />,
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
