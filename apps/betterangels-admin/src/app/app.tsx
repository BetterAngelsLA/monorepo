import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Route, Routes } from 'react-router-dom';
import { googleMapsApiKey } from '../../config';
import { AppLayout } from './Layout/AppLayout';
import SignIn from './pages/sign-in';
import { routeChildren } from './routes/appRoutes';

export function App() {
  function onMapsProviderError(error: unknown) {
    console.error(`[admin] MapsApiProvider error: ${error}`);
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {routeChildren.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        <Route>
          <Route path="/sign-in" element={<SignIn />} />
        </Route>
      </Routes>
    </MapsApiProvider>
  );
}

export default App;
