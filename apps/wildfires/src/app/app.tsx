import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';
import { useScrollTopOnLocationChange } from './shared/hooks/useScrollTopOnLocationChange';

const queryClient = new QueryClient();

export function App() {
  useScrollTopOnLocationChange();

  return (
    <QueryClientProvider client={queryClient}>
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
