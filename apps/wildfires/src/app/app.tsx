import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';
import { useScrollTopOnLocationChange } from './shared/hooks/useScrollTopOnLocationChange';

export function App() {
  useScrollTopOnLocationChange();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {routeChildren.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
