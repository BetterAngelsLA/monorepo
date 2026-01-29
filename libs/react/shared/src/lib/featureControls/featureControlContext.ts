import { ApolloQueryResult } from '@apollo/client';
import { createContext, useContext } from 'react';
import { FeatureControlGroups, FeatureControlsQuery } from './interfaces';

export interface TFeatureControlContext extends FeatureControlGroups {
  clearFeatureFlags: () => void;
  refetchFeatureFlags: (
    variables?: Record<string, unknown>
  ) => Promise<ApolloQueryResult<FeatureControlsQuery>>;
}

export const FeatureControlContext = createContext<
  TFeatureControlContext | undefined
>(undefined);

export const useFeatureControls = (): TFeatureControlContext => {
  const context = useContext(FeatureControlContext);
  if (context === undefined) {
    throw new Error(
      'useFeatureControls must be used within a FeatureControlProvider'
    );
  }
  return context;
};
