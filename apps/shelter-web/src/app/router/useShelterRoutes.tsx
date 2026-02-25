import { useFeatureFlagActive } from '@monorepo/react/shared';
import { FeatureFlags } from '@monorepo/react/shelter';
import { Route } from 'react-router-dom';
import { buildShelterRoutes } from './buildShelterRoutes';

export const useShelterRoutes = () => {
  const operatorEnabled = useFeatureFlagActive(
    FeatureFlags.SHELTER_OPERATOR_APP
  );

  return buildShelterRoutes(operatorEnabled).map((route) => (
    <Route key={route.path} path={route.path} element={route.element} />
  ));
};
