import { createContext, useContext } from 'react';
import { FeatureControlGroups } from './interfaces';

// Create the context
export const FeatureControlContext = createContext<
  FeatureControlGroups | undefined
>(undefined);

export const useFeatureControls = (): FeatureControlGroups => {
  const context = useContext(FeatureControlContext);
  if (context === undefined) {
    throw new Error(
      'useFeatureControls must be used within a FeatureControlProvider'
    );
  }
  return context;
};
