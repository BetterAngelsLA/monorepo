import { CreateShelterForm, OperatorDashboard, OperatorLogin, OperatorPortal } from '@monorepo/react/shelter-operator';
import { Link, RouteObject } from 'react-router-dom';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { OperatorApp } from '@monorepo/react/shelter-operator';
import { Route, RouteObject } from 'react-router-dom';
import { FeatureFlags } from '../constants/featureFlags';
import { Policy } from '../pages/Policy';
import Gallery from '../pages/gallery/gallery';
import { Home } from '../pages/home/home';
import Shelter from '../pages/shelter/shelter';
import {
  operatorPath,
  privacyPolicyPath,
  shelterDetailsPath,
  shelterGalleryPath,
  shelterHomePath,
} from './routePaths';

export const buildRouteChildren = (operatorEnabled: boolean): RouteObject[] => {
  return [
    {
      path: shelterHomePath,
      element: <Home />,
    },
    {
      path: shelterDetailsPath,
      element: <Shelter />,
    },
    {
      path: shelterGalleryPath,
      element: <Gallery />,
    },
    {
      path: privacyPolicyPath,
      element: <Policy />,
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

export const useRouteChildren = () => {
  const operatorEnabled = useFeatureFlagActive(
    FeatureFlags.SHELTER_OPERATOR_APP
  );

  return buildRouteChildren(operatorEnabled).map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  ));
};
