import { OperatorLayout } from '@monorepo/layout/operatorLayout/operatorLayout';
import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';

const googleMapsApiKey = import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY;

export function App() {
  function onMapsProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Routes>
        {routeChildren.map((route) => (
          <Route
            path={route.path}
            element={
              route.path.startsWith('/operator') ? (
                <OperatorLayout />
              ) : (
                <MainLayout />
              )
            }
          >
            <Route path={route.path} element={route.element} />
          </Route>
        ))}
      </Routes>
    </MapsApiProvider>
  );
}

export default App;
