import { useContext } from 'react';
import { FeatureControlContext, TFeatureFlagValue } from '../../providers';

export default function useFeatureFlagActive(
  flagName: TFeatureFlagValue
): boolean {
  const context = useContext(FeatureControlContext);

  if (!context) {
    throw new Error('FeatureControlContext missing');
  }

  return context.flags[flagName]?.isActive;
}
