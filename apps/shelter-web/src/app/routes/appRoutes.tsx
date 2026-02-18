import { OperatorApp } from '@monorepo/react/shelter-operator';
import { Route, RouteObject } from 'react-router-dom';
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

export const buildRouteChildren = (): RouteObject[] => {
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
    {
      path: `${operatorPath}/*`,
      element: <OperatorApp />,
    },
  ];
};

export const useRouteChildren = () => {
  return buildRouteChildren().map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  ));
};
