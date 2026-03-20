import { useFeatureFlagActive } from '@monorepo/react/shared';
import { FeatureFlags } from '@monorepo/react/shelter';
import type { RouteObject } from 'react-router-dom';
import { operatorRoute } from './buildShelterRoutes';

export const useOperatorRoute = (): RouteObject | null => {
  const operatorEnabled = useFeatureFlagActive(
    FeatureFlags.SHELTER_OPERATOR_APP
  );

  return operatorEnabled ? operatorRoute : null;
};
