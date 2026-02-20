import {
  operatorPath,
  privacyPolicyPath,
  shelterDetailsPath,
  shelterGalleryPath,
  shelterHomePath,
} from '@monorepo/react/shelter';
import { OperatorApp } from '@monorepo/react/shelter-operator';
import { RouteObject } from 'react-router-dom';
import { GalleryRoute } from '../routes/gallery.route';
import { HomeRoute } from '../routes/home.route';
import { PolicyRoute } from '../routes/policy.route';
import { ShelterRoute } from '../routes/shelter.route';

export const buildShelterRoutes = (operatorEnabled: boolean): RouteObject[] => {
  return [
    {
      path: shelterHomePath,
      element: <HomeRoute />,
    },
    {
      path: shelterDetailsPath,
      element: <ShelterRoute />,
    },
    {
      path: shelterGalleryPath,
      element: <GalleryRoute />,
    },
    {
      path: privacyPolicyPath,
      element: <PolicyRoute />,
    },
    ...(operatorEnabled
      ? [
          {
            path: `${operatorPath}/*`,
            element: <OperatorApp />,
          },
        ]
      : []),
  ];
};
