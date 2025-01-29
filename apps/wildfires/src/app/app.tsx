import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import ResultPdfpage from './pages/resultPdf';
import { routeChildren } from './routes/appRoutes';
import { resultPdfPagePath } from './routes/routePaths';
import RouteTracker from './shared/components/RouterTracker';
import { useScrollTopOnLocationChange } from './shared/hooks/useScrollTopOnLocationChange';
import { initGA } from './shared/utils/analytics';

const queryClient = new QueryClient();

export function App() {
  const location = useLocation();

  useScrollTopOnLocationChange();

  useEffect(() => {
    initGA();
  }, []);

  if (location.pathname === resultPdfPagePath) {
    return (
      <QueryClientProvider client={queryClient}>
        <RouteTracker />
        <Routes>
          <Route path="/">
            <Route
              key={resultPdfPagePath}
              path={resultPdfPagePath}
              element={<ResultPdfpage />}
            />
          </Route>
        </Routes>
      </QueryClientProvider>
    );
  }

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
