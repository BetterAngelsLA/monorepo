import {
  privacyPolicyPath,
  shelterDetailsPath,
  shelterFiltersPath,
  shelterGalleryPath,
  shelterHomePath,
  shelterVideoPath,
  signInPath,
} from '@monorepo/react/shelter';
import { Route } from 'react-router-dom';
import { FiltersRoute } from '../routes/filters.route';
import { GalleryRoute } from '../routes/gallery.route';
import { HomeRoute } from '../routes/home.route';
import { PolicyRoute } from '../routes/policy.route';
import { ShelterRoute } from '../routes/shelter.route';
import { SignInRoute } from '../routes/signin.route';
import { VideoRoute } from '../routes/video.route';

export function buildShelterRoutes() {
  return (
    <>
      <Route
        key={shelterHomePath}
        path={shelterHomePath}
        element={<HomeRoute />}
      />
      <Route
        key={shelterFiltersPath}
        path={shelterFiltersPath}
        element={<FiltersRoute />}
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
      <Route key={signInPath} path={signInPath} element={<SignInRoute />} />
    </>
  );
}
