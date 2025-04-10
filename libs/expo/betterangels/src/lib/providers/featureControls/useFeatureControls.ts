import { useContext } from 'react';
import {
  FeatureControlContext,
  TFeatureControlContext,
} from './featureControlContext';

export const useFeatureControls = (): TFeatureControlContext => {
  const context = useContext(FeatureControlContext);

  if (context === undefined) {
    throw new Error(
      'useFeatureControls must be used within a FeatureControlProvider'
    );
  }

  return context;
};
