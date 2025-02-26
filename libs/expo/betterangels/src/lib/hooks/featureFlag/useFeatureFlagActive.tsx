import { useContext } from 'react';
import { TFeatureFlagValue } from '../../providers/featureControls/constants';
import { FeatureControlContext } from '../../providers/featureControls/featureControlContext';

export default function useFeatureFlagActive(
  flagName: TFeatureFlagValue
): boolean {
  const context = useContext(FeatureControlContext);

  if (!context) {
    throw new Error('FeatureControlContext missing');
  }

  return context.flags[flagName]?.isActive;
}
