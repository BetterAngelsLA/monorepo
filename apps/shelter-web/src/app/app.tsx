import { Route, Routes } from 'react-router-dom';
import { ContentLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ContentLayout />}>
        {routeChildren.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
