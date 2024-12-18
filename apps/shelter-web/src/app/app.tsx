import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layout/mainLayout';
import { routeChildren } from './routes/appRoutes';

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function App() {
  function onMapsProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {routeChildren.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </MapsApiProvider>
  );
}

export default App;
