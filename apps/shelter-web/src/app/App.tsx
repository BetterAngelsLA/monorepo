import { MainLayout } from '@monorepo/react/shelter';
import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Route, Routes } from 'react-router-dom';
import { useShelterRoutes } from './router';

const googleMapsApiKey = import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY;

export function App() {
  const shelterRoutes = useShelterRoutes();

  function onMapsProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {shelterRoutes}
        </Route>
      </Routes>
    </MapsApiProvider>
  );
}
