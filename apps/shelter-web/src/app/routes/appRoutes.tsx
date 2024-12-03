import { Link, RouteObject } from 'react-router-dom';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: (
      <div>
        <div>ROOT page</div>
        <Link to="/page-2">go to page 2</Link>
      </div>
    ),
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
