import { Link, Route, Routes } from 'react-router-dom';

import { routeChildren } from './routes/appRoutes';

export function App() {
  return (
    <div className="px-24">
      <div role="navigation">
        <h1>hello shelter-app</h1>
        <ul>
          <li className="my-4">
            <Link to="/">Home link</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2 link</Link>
          </li>
        </ul>
      </div>

      <hr className="my-12" />

      <Routes>
        {routeChildren.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </div>
  );
}

export default App;
