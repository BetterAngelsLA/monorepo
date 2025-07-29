import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './Layout/AppLayout';
import { routeChildren } from './routes/appRoutes';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {routeChildren.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
