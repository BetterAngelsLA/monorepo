import { createContext, useContext } from 'react';
import { FeatureControlGroups } from './types';

export interface FeatureControlContextValue extends FeatureControlGroups {
  loading: boolean;
  error?: Error;
  refetchFeatureFlags: () => Promise<unknown>;
  clearFeatureFlags: () => void;
}

export const FeatureControlContext = createContext<
  FeatureControlContextValue | undefined
>(undefined);

export function useFeatureControls(): FeatureControlContextValue {
  const context = useContext(FeatureControlContext);

  if (!context) {
    throw new Error(
      'useFeatureControls must be used within a FeatureControlProvider'
    );
  }

  return context;
}
