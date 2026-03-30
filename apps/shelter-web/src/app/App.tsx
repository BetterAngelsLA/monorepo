import { useFeatureFlagActive } from '@monorepo/react/shared';
import {
  FeatureFlags,
  MainLayout,
  operatorPath,
} from '@monorepo/react/shelter';
import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useShelterRoutes } from './router';

const OperatorApp = lazy(() =>
  import('@monorepo/react/shelter-operator').then((m) => ({
    default: m.OperatorApp,
  }))
);

const googleMapsApiKey = import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY;

export function App() {
  const shelterRoutes = useShelterRoutes();
  const operatorEnabled = useFeatureFlagActive(
    FeatureFlags.SHELTER_OPERATOR_APP
  );

  function onMapsProviderError(error: unknown) {
    console.error(`MapsApiProvider error ${error}`);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Routes>
        <Route element={<MainLayout />}>{shelterRoutes}</Route>
        {operatorEnabled && (
          <Route
            path={`${operatorPath}/*`}
            element={
              <Suspense fallback={null}>
                <OperatorApp />
              </Suspense>
            }
          />
        )}
      </Routes>
    </MapsApiProvider>
  );
}
