import { useContext } from 'react';
import { FeatureControlContext } from './featureControlContext';

export default function useFeatureFlagActive(flagName: string): boolean {
  const context = useContext(FeatureControlContext);

  if (!context) {
    throw new Error('FeatureControlContext missing');
  }

  return context.flags[flagName]?.isActive === true;
}
