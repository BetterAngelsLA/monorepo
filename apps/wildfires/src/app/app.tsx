import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';
import RouteTracker from './shared/components/RouterTracker';
import { useScrollTopOnLocationChange } from './shared/hooks/useScrollTopOnLocationChange';
import { initGA } from './shared/utils/analytics';

const queryClient = new QueryClient();

export function App() {
  useScrollTopOnLocationChange();

  useEffect(() => {
    initGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {routeChildren.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
