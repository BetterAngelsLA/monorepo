import { Route } from 'react-router-dom';
import { buildShelterRoutes } from './buildShelterRoutes';

export const useShelterRoutes = () => {
  return buildShelterRoutes().map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  ));
};
