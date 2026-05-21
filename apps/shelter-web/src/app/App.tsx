import { useFeatureFlagActive } from '@monorepo/react/shared';
import {
  FeatureFlags,
  MainLayout,
  SignIn,
  operatorPath,
} from '@monorepo/react/shelter';
import { OperatorApp } from '@monorepo/react/shelter-operator';
import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Route, Routes } from 'react-router-dom';
import { useShelterRoutes } from './router';

const googleMapsApiKey = import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY;

function OperatorSignIn() {
  return (
    <SignIn
      onSuccessRedirect="/operator"
      description="Welcome! Sign in or create an account to start making a difference in the LA Community."
      allowSignUp
    />
  );
}

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
        <Route element={<MainLayout />}>
          {shelterRoutes}
          {operatorEnabled && (
            <Route
              path={`${operatorPath}/sign-in`}
              element={<OperatorSignIn />}
            />
          )}
        </Route>
        {operatorEnabled && (
          <Route path={`${operatorPath}/*`} element={<OperatorApp />} />
        )}
      </Routes>
    </MapsApiProvider>
  );
}
