import { Link, RouteObject } from 'react-router-dom';
import { Home } from '../pages/home/home';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
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
