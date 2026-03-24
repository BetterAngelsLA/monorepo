import {
  operatorPath,
  privacyPolicyPath,
  shelterDetailsPath,
  shelterGalleryPath,
  shelterHomePath,
  shelterVideoPath,
} from '@monorepo/react/shelter';
import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { GalleryRoute } from '../routes/gallery.route';
import { HomeRoute } from '../routes/home.route';
import { PolicyRoute } from '../routes/policy.route';
import { ShelterRoute } from '../routes/shelter.route';
import { VideoRoute } from '../routes/video.route';

const OperatorApp = lazy(() =>
  import('@monorepo/react/shelter-operator').then((m) => ({
    default: m.OperatorApp,
  }))
);

export function buildShelterRoutes(operatorEnabled: boolean) {
  return (
    <>
      <Route
        key={shelterHomePath}
        path={shelterHomePath}
        element={<HomeRoute />}
      />
      <Route
        key={shelterDetailsPath}
        path={shelterDetailsPath}
        element={<ShelterRoute />}
      />
      <Route
        key={shelterGalleryPath}
        path={shelterGalleryPath}
        element={<GalleryRoute />}
      />
      <Route
        key={privacyPolicyPath}
        path={privacyPolicyPath}
        element={<PolicyRoute />}
      />
      <Route
        key={shelterVideoPath}
        path={shelterVideoPath}
        element={<VideoRoute />}
      />
      {operatorEnabled && (
        <Route
          key={operatorPath}
          path={`${operatorPath}/*`}
          element={
            <Suspense fallback={null}>
              <OperatorApp />
            </Suspense>
          }
        />
      )}
    </>
  );
}
