import {
  operatorPath,
  privacyPolicyPath,
  shelterDetailsPath,
  shelterGalleryPath,
  shelterHomePath,
} from '@monorepo/react/shelter';
import { OperatorApp } from '@monorepo/react/shelter-operator';
import { Route } from 'react-router-dom';
import { GalleryRoute } from '../routes/gallery.route';
import { HomeRoute } from '../routes/home.route';
import { PolicyRoute } from '../routes/policy.route';
import { ShelterRoute } from '../routes/shelter.route';

export const publicRoutes = [
  <Route
    key={shelterHomePath}
    path={shelterHomePath}
    element={<HomeRoute />}
  />,
  <Route
    key={shelterDetailsPath}
    path={shelterDetailsPath}
    element={<ShelterRoute />}
  />,
  <Route
    key={shelterGalleryPath}
    path={shelterGalleryPath}
    element={<GalleryRoute />}
  />,
  <Route
    key={privacyPolicyPath}
    path={privacyPolicyPath}
    element={<PolicyRoute />}
  />,
];

export const operatorRoute = (
  <Route path={`${operatorPath}/*`} element={<OperatorApp />} />
);
