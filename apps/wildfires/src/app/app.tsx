import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';
import RouteTracker from './shared/components/RouterTracker';
import { initGA } from './shared/utils/analytics';

export function App() {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {routeChildren.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </>
  );
}

export default App;
