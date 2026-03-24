import { useFeatureFlagActive } from '@monorepo/react/shared';
import { FeatureFlags } from '@monorepo/react/shelter';
import { buildShelterRoutes } from './buildShelterRoutes';

export const useOperatorRoute = () => {
  const operatorEnabled = useFeatureFlagActive(
    FeatureFlags.SHELTER_OPERATOR_APP
  );

  return buildShelterRoutes(operatorEnabled);
};
