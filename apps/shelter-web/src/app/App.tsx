import { MainLayout } from '@monorepo/react/shelter';
import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { publicRoutes, useOperatorRoute } from './router';

const googleMapsApiKey = import.meta.env.VITE_SHELTER_GOOGLE_MAPS_API_KEY;
const basename = import.meta.env.VITE_APP_BASE_PATH || '/';

export function App() {
  const operatorRoute = useOperatorRoute();

  const router = useMemo(
    () =>
      createBrowserRouter(
        [
          {
            path: '/',
            element: <MainLayout />,
            children: publicRoutes,
          },
          ...(operatorRoute ? [operatorRoute] : []),
        ],
        { basename }
      ),
    [operatorRoute]
  );

  return (
    <MapsApiProvider
      apiKey={googleMapsApiKey}
      onError={(error) => console.error(`MapsApiProvider error ${error}`)}
    >
      <RouterProvider router={router} />
    </MapsApiProvider>
  );
}
