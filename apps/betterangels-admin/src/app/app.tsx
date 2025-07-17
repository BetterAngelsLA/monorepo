import { Route, Routes } from 'react-router-dom';
import { routeChildren } from './routes/appRoutes';

export function App() {
  return (
    <Routes>
      <Route path="/">
        {routeChildren.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
