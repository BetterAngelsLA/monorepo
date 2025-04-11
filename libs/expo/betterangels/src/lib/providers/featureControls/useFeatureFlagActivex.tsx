import { useContext } from 'react';
import { FeatureControlContext } from './featureControlContext';
import { TFeatureControls, TFeatureFlagValue } from './types';

export const HELLO = 'ASER';

export function useFeatureFlagActivex(flagName: TFeatureFlagValue): boolean {
  const context = useContext(FeatureControlContext);

  if (!context) {
    throw new Error('FeatureControlContext missing');
  }

  return !!(context.flags as TFeatureControls)[flagName]?.isActive;
}
