import { MainLayout, operatorPath } from '@monorepo/react/shelter';
import { OperatorApp } from '@monorepo/react/shelter-operator';
import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Route, Routes } from 'react-router-dom';
import { useShelterRoutes } from './router';

// Inlined by Vite at build time, so a bundle built without this key can never
// load a map. CI supplies it to the `build` step and to `deploy`, which rebuilds
// this app; see `.github/workflows/default.yml`.
const googleMapsApiKey = import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY;

export function App() {
  const shelterRoutes = useShelterRoutes();

  function onMapsProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Routes>
        <Route element={<MainLayout />}>{shelterRoutes}</Route>
        <Route path={`${operatorPath}/*`} element={<OperatorApp />} />
      </Routes>
    </MapsApiProvider>
  );
}
